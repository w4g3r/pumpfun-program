import { PublicKey } from '@solana/web3.js';
import { BN } from '@anchor-lang/core';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
  TOKEN_DECIMALS,
  fee,
  fetchBondingCurve,
  fetchGlobal,
  formatUnits,
  getProgram,
  getRandomFeeRecipient,
  solReceived,
  tokenToBaseUnits,
} from './common';

// -a is the token amount to sell (UI units, 6 decimals)
export async function sell(mintAddress: string, tokenAmount: string) {
  const { program, connection, user } = getProgram();
  const mint = new PublicKey(mintAddress);
  const global = await fetchGlobal(program);
  const curve = await fetchBondingCurve(program, mint);
  const associatedUser = getAssociatedTokenAddressSync(mint, user, true);

  const amount = tokenToBaseUnits(tokenAmount);
  const balance = await connection.getTokenAccountBalance(associatedUser).catch(() => null);
  if (!balance || new BN(balance.value.amount).lt(amount)) {
    throw new Error(`Not enough token balance. Have ${balance?.value.uiAmountString ?? 0}, need ${tokenAmount}`);
  }

  const sol = solReceived(amount, curve.virtualTokenReserves, curve.virtualSolReserves);
  const minSolOutput = sol.sub(fee(sol, global.feeBasisPoints));

  const sig = await program.methods
    .sell(amount, minSolOutput)
    .accountsPartial({
      user,
      mint,
      associatedUser,
      feeRecipient: getRandomFeeRecipient(global.feeRecipients),
    })
    .rpc();

  console.log(
    `Sold ${formatUnits(amount, TOKEN_DECIMALS)} tokens (${amount.toString()} base units) for at least ${formatUnits(minSolOutput, 9)} SOL`,
  );
  console.log(`tx: ${sig}`);
}