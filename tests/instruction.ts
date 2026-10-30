import { Program } from '@anchor-lang/core';
import { Pumpfun } from '../target/types/pumpfun';
import { adminKp, userKp } from './constant';
import { Keypair, PublicKey, Signer } from '@solana/web3.js';
import BN from 'bn.js';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { getConfigPda, getRandomFeeRecipient } from './utils';
import { Global } from './state';

export async function initialize(program: Program<Pumpfun>) {
  try {
    return await program.methods
      .initialize()
      .accounts({
        admin: adminKp.publicKey,
      })
      .signers([adminKp])
      .rpc();
  } catch (e) {
    throw e;
  }
}

export async function setParams(
  program: Program<Pumpfun>,
  fee_recipients: PublicKey[],
  initial_virtual_token_reserves: BN,
  initial_virtual_sol_reserves: BN,
  initial_real_token_reserves: BN,
  token_total_supply: BN,
  fee_basis_points: BN,
  withdraw_authority: PublicKey,
  enable_migrate: boolean,
  pool_migration_fee: BN,
) {
  try {
    return await program.methods
      .setParams(
        fee_recipients,
        initial_virtual_token_reserves,
        initial_virtual_sol_reserves,
        initial_real_token_reserves,
        token_total_supply,
        fee_basis_points,
        withdraw_authority,
        enable_migrate,
        pool_migration_fee,
      )
      .accountsPartial({ global: getConfigPda(program.programId), authority: adminKp.publicKey })
      .signers([adminKp])
      .rpc();
  } catch (e) {
    throw e;
  }
}
export async function create(
  program: Program<Pumpfun>,
  TEST_NAME: string,
  TEST_SYMBOL: string,
  TEST_URI: string,
  mint: Keypair,
  user: Keypair,
) {
  try {
    return await program.methods
      .create(TEST_NAME, TEST_SYMBOL, TEST_URI)
      .accountsPartial({
        mint: mint.publicKey,
        user: user.publicKey,
      })
      .signers([user, mint])
      .rpc();
  } catch (e) {
    throw e;
  }
}

export async function createAndBuy(
  program: Program<Pumpfun>,
  global: Global,
  TEST_NAME: string,
  TEST_SYMBOL: string,
  TEST_URI: string,
  mint: Keypair,
  user: Keypair,
  amount: BN,
  max_sol_cost: BN,
) {
  try {
    const buyIx = await (
      await buyInternal(program, global, new BN(amount), new BN(max_sol_cost), mint.publicKey, user.publicKey)
    ).instruction();
    return await program.methods
      .create(TEST_NAME, TEST_SYMBOL, TEST_URI)
      .accountsPartial({
        mint: mint.publicKey,
        user: user.publicKey,
      })
      .postInstructions([
        createAssociatedTokenAccountInstruction(
          user.publicKey,
          getAssociatedTokenAddressSync(mint.publicKey, user.publicKey),
          user.publicKey,
          mint.publicKey,
        ),
        buyIx,
      ])
      .signers([user, mint])
      .rpc();
  } catch (e) {
    throw e;
  }
}

export async function buy(
  program: Program<Pumpfun>,
  global: Global,
  amount: BN,
  max_sol_cost: BN,
  mint: PublicKey,
  user: Signer,
  skipPreflight = false,
) {
  try {
    return await (
      await buyInternal(program, global, new BN(amount), new BN(max_sol_cost), mint, user.publicKey)
    )
      .preInstructions([
        createAssociatedTokenAccountIdempotentInstruction(
          user.publicKey,
          getAssociatedTokenAddressSync(mint, user.publicKey),
          user.publicKey,
          mint,
        ),
      ])
      .signers([user])
      .rpc({
        skipPreflight,
        commitment: 'processed',
        preflightCommitment: 'processed',
      });
  } catch (e) {
    throw e;
  }
}

export async function sell(
  program: Program<Pumpfun>,
  global: Global,
  amount: BN,
  min_sol_received: BN,
  mint: PublicKey,
  user: Signer,
) {
  try {
    return await (await sellInternal(program, global, new BN(amount), new BN(min_sol_received), mint, user.publicKey))
      .signers([user])
      .rpc();
  } catch (e) {
    throw e;
  }
}

async function buyInternal(
  program: Program<Pumpfun>,
  global: Global,
  amount: BN,
  max_sol_cost: BN,
  mint: PublicKey,
  user: PublicKey,
): Promise<ReturnType<Program<Pumpfun>['methods']['buy']>> {
  try {
    return program.methods.buy(amount, max_sol_cost).accountsPartial({
      user: user,
      mint,
      associatedUser: getAssociatedTokenAddressSync(mint, user, true),
      feeRecipient: getRandomFeeRecipient(global.feeRecipients),
    });
  } catch (e) {
    throw e;
  }
}

async function sellInternal(
  program: Program<Pumpfun>,
  global: Global,
  amount: BN,
  min_sol_received: BN,
  mint: PublicKey,
  user: PublicKey,
): Promise<ReturnType<Program<Pumpfun>['methods']['sell']>> {
  try {
    return program.methods.sell(amount, min_sol_received).accountsPartial({
      user: user,
      mint,
      associatedUser: getAssociatedTokenAddressSync(mint, user, true),
      feeRecipient: getRandomFeeRecipient(global.feeRecipients),
    });
  } catch (e) {
    throw e;
  }
}
