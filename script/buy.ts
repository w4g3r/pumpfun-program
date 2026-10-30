import { PublicKey } from '@solana/web3.js';
import { createAssociatedTokenAccountIdempotentInstruction, getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
  TOKEN_DECIMALS,
  fee,
  fetchBondingCurve,
  fetchGlobal,
  formatUnits,
  getProgram,
  getRandomFeeRecipient,
  solCost,
  solToLamports,
  tokenReceived,
} from './common';

// -a is the SOL amount to spend; token amount is derived from the bonding curve
export async function buy(mintAddress: string, solAmount: string) {
  const { program, user } = getProgram();
  const mint = new PublicKey(mintAddress);
  const global = await fetchGlobal(program);
  const curve = await fetchBondingCurve(program, mint);

  const amount = tokenReceived(solToLamports(solAmount), curve.virtualTokenReserves, curve.virtualSolReserves);
  const sol = solCost(amount, curve.virtualTokenReserves, curve.virtualSolReserves);
  const maxSolCost = sol.add(fee(sol, global.feeBasisPoints));

  const sig = await program.methods
    .buy(amount, maxSolCost)
    .accountsPartial({
      user,
      mint,
      associatedUser: getAssociatedTokenAddressSync(mint, user, true),
      feeRecipient: getRandomFeeRecipient(global.feeRecipients),
    })
    .preInstructions([
      createAssociatedTokenAccountIdempotentInstruction(
        user,
        getAssociatedTokenAddressSync(mint, user),
        user,
        mint,
      ),
    ])
    .rpc();

  console.log(
    `Bought ${formatUnits(amount, TOKEN_DECIMALS)} tokens (${amount.toString()} base units) for up to ${formatUnits(maxSolCost, 9)} SOL`,
  );
  console.log(`tx: ${sig}`);
}