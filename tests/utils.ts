import { Connection, LAMPORTS_PER_SOL, PublicKey, TransactionConfirmationStrategy } from '@solana/web3.js';

import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  adminKp,
  AUTHORITY,
  list_fee_recipients,
  SEED_BONDING_CURVE,
  SEED_GLOBAL,
  user2Kp,
  userKp,
  withdrawKp,
  WSOL_ADDRESS,
} from './constant';
import { BN, IdlEvents, Program } from '@anchor-lang/core';
import { Pumpfun } from '../target/types/pumpfun';
import { BondingCurve, Global } from './state';

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const getAssociatedTokenAccount = (ownerPubkey: PublicKey, mintPk: PublicKey): PublicKey => {
  let associatedTokenAccountPubkey = PublicKey.findProgramAddressSync(
    [
      ownerPubkey.toBytes(),
      TOKEN_PROGRAM_ID.toBytes(),
      mintPk.toBytes(), // mint address
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];

  return associatedTokenAccountPubkey;
};
//for buy
export function solCost(minAmount: BN, virtualTokenReserves: BN, virtualSolReserves: BN): BN {
  return minAmount.mul(virtualSolReserves).div(virtualTokenReserves.sub(minAmount)).add(new BN(1));
}

//to find out how much token received by using sol
export function tokenReceived(inputAmount: BN, virtualTokenReserves: BN, virtualSolReserves: BN): BN {
  return inputAmount.mul(virtualTokenReserves).div(virtualSolReserves.add(inputAmount));
}

//for sell
export function solReceived(inputAmount: BN, virtualTokenReserves: BN, virtualSolReserves: BN): BN {
  return inputAmount.mul(virtualSolReserves).div(virtualTokenReserves.add(inputAmount));
}

export async function prepareWallet(connection: Connection) {
  // Request all airdrops
  const requests: Promise<string>[] = [];

  for (const pubkey of list_fee_recipients) {
    requests.push(connection.requestAirdrop(new PublicKey(pubkey), 1 * LAMPORTS_PER_SOL));
  }

  requests.push(connection.requestAirdrop(adminKp.publicKey, 300 * LAMPORTS_PER_SOL));
  requests.push(connection.requestAirdrop(withdrawKp.publicKey, 300 * LAMPORTS_PER_SOL));
  requests.push(connection.requestAirdrop(userKp.publicKey, 300 * LAMPORTS_PER_SOL));
  requests.push(connection.requestAirdrop(user2Kp.publicKey, 20000 * LAMPORTS_PER_SOL));

  // Wait for all signatures
  const sigs = await Promise.all(requests);

  // Confirm them in parallel
  await Promise.all(
    sigs.map((sig) =>
      connection.confirmTransaction({
        signature: sig,
        abortSignal: AbortSignal.timeout(10000),
      } as TransactionConfirmationStrategy),
    ),
  );

  console.log('Airdropped SOL to test wallets');
}
export function getRandomFeeRecipient(list: any) {
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}
export function getConfigPda(programId: PublicKey) {
  const [globalConfigPda] = PublicKey.findProgramAddressSync([Buffer.from(SEED_GLOBAL)], programId);
  return globalConfigPda;
}

export function getAuthorityClassicPad(mint: PublicKey, programId: PublicKey) {
  const [authorityCLASSICPAD] = PublicKey.findProgramAddressSync([Buffer.from(AUTHORITY)], programId);
  return authorityCLASSICPAD;
}

export function getBondingCurve(mint: PublicKey, programId: PublicKey) {
  const [bondigCurve] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(SEED_BONDING_CURVE),
      mint.toBuffer(), // depends on how you're loading `bondingCurve`
    ],
    programId,
  );
  return bondigCurve;
}
export async function fetchConfigPda(program: Program<Pumpfun>) {
  return await program.account.global.fetch(getConfigPda(program.programId), 'processed');
}
export async function fetchBondingCurve(mint: PublicKey, program: Program<Pumpfun>) {
  return await program.account.bondingCurve.fetch(getBondingCurve(mint, program.programId), 'processed');
}

type ClassicPadEvents = IdlEvents<Pumpfun>;
export async function getEvent<K extends keyof ClassicPadEvents>(
  program: Program<Pumpfun>,
  eventName: K,
  runMethod: () => Promise<string>,
) {
  let listenerId = 0;

  const event = await new Promise<ClassicPadEvents[K]>((resolve, reject) => {
    // attach listener
    listenerId = program.addEventListener(eventName, (evt) => {
      resolve(evt);
    });

    // run the provided method and catch errors
    (async () => {
      try {
        await runMethod();
      } catch (err) {
        await program.removeEventListener(listenerId);
        reject(err);
      }
    })();
  });

  await program.removeEventListener(listenerId);

  return event;
}
export interface CalculatedFeesBps {
  protocolFeeBps: BN;
}

export function getFee({
  global,
  bondingCurve,
  amount,
  isNewBondingCurve,
}: {
  global: Global;
  bondingCurve: BondingCurve;
  amount: BN;
  isNewBondingCurve: boolean;
}) {
  const { protocolFeeBps } = computeFeesBps({
    global,
  });

  return fee(amount, protocolFeeBps);
}

export function computeFeesBps({ global }: { global: Global }): CalculatedFeesBps {
  return {
    protocolFeeBps: global.feeBasisPoints,
  };
}

export function fee(amount: BN, feeBasisPoints: BN): BN {
  return ceilDiv(amount.mul(feeBasisPoints), new BN(10_000));
}

function ceilDiv(a: BN, b: BN): BN {
  return a.add(b.subn(1)).div(b);
}
export function newBondingCurve(global: Global): BondingCurve {
  return {
    virtualTokenReserves: global.initialVirtualTokenReserves,
    virtualSolReserves: global.initialVirtualSolReserves,
    realTokenReserves: global.initialRealTokenReserves,
    realSolReserves: new BN(0),
    tokenTotalSupply: global.tokenTotalSupply,
    complete: false,
  };
}

export async function fetchState(program: Program<Pumpfun>, global: Global, mint: PublicKey, user: PublicKey) {
  const [bondingCurveAccountInfo, associatedUserAccountInfo] =
    await program.provider.connection.getMultipleAccountsInfo([
      getBondingCurve(mint, program.programId),
      getAssociatedTokenAddressSync(mint, user, true),
    ]);

  let bondingCurve: BondingCurve;
  let isNewBondingCurve = true;
  if (bondingCurveAccountInfo) {
    isNewBondingCurve = false;
    bondingCurve = program.coder.accounts.decode<BondingCurve>('bondingCurve', bondingCurveAccountInfo.data);
  } else {
    bondingCurve = newBondingCurve(global);
  }

  return { isNewBondingCurve, bondingCurve, bondingCurveAccountInfo, associatedUserAccountInfo };
}
