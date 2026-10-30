import { assert } from 'chai';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_PROGRAM_ID,
  getAccount,
} from '@solana/spl-token';
import { programPumpfun, token2Kp, user2Kp, withdrawKp, WSOL_ADDRESS } from '../constant';
import { buy } from '../instruction';
import { fetchBondingCurve, fetchConfigPda, fetchState, getBondingCurve, getFee } from '../utils';
import * as nodeAssert from 'assert';

describe('prepare migration', () => {
  it('withdraws completed curve reserves only to the configured authority', async () => {
    const mint = token2Kp.publicKey;
    const global = await fetchConfigPda(programPumpfun);
    const { isNewBondingCurve, bondingCurve } = await fetchState(programPumpfun, global, mint, user2Kp.publicKey);
    const amount = bondingCurve.realTokenReserves;
    const solCost = amount
      .mul(bondingCurve.virtualSolReserves)
      .add(bondingCurve.virtualTokenReserves.sub(amount))
      .subn(1)
      .div(bondingCurve.virtualTokenReserves.sub(amount));
    const maxSolCost = solCost.add(getFee({ global, bondingCurve, amount: solCost, isNewBondingCurve }));
    await buy(programPumpfun, global, amount, maxSolCost, mint, user2Kp);

    const tokenAta = getAssociatedTokenAddressSync(mint, withdrawKp.publicKey, false, TOKEN_PROGRAM_ID);
    const curveAta = getAssociatedTokenAddressSync(mint, getBondingCurve(mint, programPumpfun.programId), true);
    const curveAddress = getBondingCurve(mint, programPumpfun.programId);
    const curveBefore = await fetchBondingCurve(mint, programPumpfun);
    const curveAccountBefore = await programPumpfun.provider.connection.getAccountInfo(curveAddress);
    if (!curveAccountBefore) throw new Error('Bonding curve account is missing');
    const curveRent = await programPumpfun.provider.connection.getMinimumBalanceForRentExemption(
      curveAccountBefore.data.length,
    );
    const transferableLamports = curveAccountBefore.lamports - curveRent;
    const curveTokensBefore = await getAccount(programPumpfun.provider.connection, curveAta);
    const withdrawBalanceBefore = await programPumpfun.provider.connection.getBalance(withdrawKp.publicKey);
    const recipientAccountBefore = await programPumpfun.provider.connection.getAccountInfo(tokenAta);
    const recipientAtaRent = recipientAccountBefore
      ? 0
      : await programPumpfun.provider.connection.getMinimumBalanceForRentExemption(165);

    assert.isTrue(curveBefore.complete);
    assert.isTrue(transferableLamports > 0);
    assert.isNull(recipientAccountBefore);
    await programPumpfun.methods
      .withdraw()
      .accountsPartial({
        withdrawAuthority: withdrawKp.publicKey,
        token0Mint: WSOL_ADDRESS,
        token1Mint: mint,
        creator0Ata: withdrawKp.publicKey,
        creator1Ata: tokenAta,
      })
      .preInstructions([
        createAssociatedTokenAccountIdempotentInstruction(withdrawKp.publicKey, tokenAta, withdrawKp.publicKey, mint),
      ])
      .signers([withdrawKp])
      .rpc();

    const curveAfter = await fetchBondingCurve(mint, programPumpfun);
    const curveTokensAfter = await getAccount(programPumpfun.provider.connection, curveAta);
    const recipientTokensAfter = await getAccount(programPumpfun.provider.connection, tokenAta);
    const curveAccountAfter = await programPumpfun.provider.connection.getAccountInfo(curveAddress);
    const withdrawBalanceAfter = await programPumpfun.provider.connection.getBalance(withdrawKp.publicKey);

    if (!curveAccountAfter) throw new Error('Bonding curve account disappeared after migration');
    assert.equal(curveAfter.realSolReserves.toString(), curveBefore.realSolReserves.toString());
    assert.equal(curveAccountAfter.lamports, curveRent);
    assert.equal(curveTokensAfter.amount.toString(), '0');
    assert.equal(recipientTokensAfter.amount.toString(), curveTokensBefore.amount.toString());
    assert.equal(withdrawBalanceAfter - withdrawBalanceBefore, transferableLamports - recipientAtaRent);

    const curveLamportsAfter = await programPumpfun.provider.connection.getBalance(curveAddress);
    const withdrawBalanceAfterMigration = await programPumpfun.provider.connection.getBalance(withdrawKp.publicKey);
    const recipientTokensAfterMigration = await getAccount(programPumpfun.provider.connection, tokenAta);
    await nodeAssert.rejects(
      programPumpfun.methods
        .withdraw()
        .accountsPartial({
          withdrawAuthority: withdrawKp.publicKey,
          token0Mint: WSOL_ADDRESS,
          token1Mint: mint,
          creator0Ata: user2Kp.publicKey,
          creator1Ata: tokenAta,
        })
        .signers([withdrawKp])
        .rpc(),
      /ConstraintAddress/i,
    );
    await nodeAssert.rejects(
      programPumpfun.methods
        .withdraw()
        .accountsPartial({
          withdrawAuthority: withdrawKp.publicKey,
          token0Mint: WSOL_ADDRESS,
          token1Mint: mint,
          creator0Ata: withdrawKp.publicKey,
          creator1Ata: tokenAta,
        })
        .signers([withdrawKp])
        .rpc(),
      /AlreadyMigrate/i,
    );
    assert.equal(await programPumpfun.provider.connection.getBalance(curveAddress), curveLamportsAfter);
    assert.equal(
      await programPumpfun.provider.connection.getBalance(withdrawKp.publicKey),
      withdrawBalanceAfterMigration,
    );
    assert.equal(
      (await getAccount(programPumpfun.provider.connection, tokenAta)).amount.toString(),
      recipientTokensAfterMigration.amount.toString(),
    );
  });
});
