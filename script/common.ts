import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { AnchorProvider, BN, Program, setProvider } from '@anchor-lang/core';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

import { Pumpfun } from '../target/types/pumpfun';
import idl from '../target/idl/pumpfun.json';
import { BondingCurve, Global } from '../tests/state';

dotenv.config();

export const TOKEN_DECIMALS = 6;
export const SEED_GLOBAL = 'global';
export const SEED_BONDING_CURVE = 'bonding-curve';

// Default token metadata, same as tests/constant.ts
export const DEFAULT_NAME = 'test spl token';
export const DEFAULT_SYMBOL = 'TEST';
export const DEFAULT_URI = 'https://ipfs.io/ipfs/QmWVzSC1ZTFiBYFiZZ6QivGUZ9awPJwqZECSFL1UD4gitC';

// Default params, same as tests/demo/1.setparams.test.ts
export const DEFAULT_FEE_RECIPIENTS = [
  'AXdaFNu6z14YM81otxuFLZjBN5AR5TG2oPySqPcztest',
  'BdeNn7gnAeP34dhT7nRqwmp9EkT31YvNC6LtjXRctest',
  'Dd6DhEeaNN87S9uQqW9dVJoLjKbiNiJtkL1omGVdtest',
  'GGyVzYKcCovDUBkQvZt4azQBHizh61rQc1q36ucCtest',
  'HHGk2TdovrZDGnFfR6GPWumDjA3Fa1NqCuRNnaQRtest',
  'HwMz7stjC8qrTsE66cjdwUBQmP9XcBLGzXYJ63EVtest',
  'JhsipQQBMxSEgtkii8dt46c1qLEdVX2qRcMLJcxtest',
  'pkR6mE7WCpMwzYKF2PzkwMyrDScLuqRGTGN3jzYtest',
];
export const DEFAULT_WITHDRAW_AUTHORITY = '3g2ww1F3XRK1FnReCULuEADbmK16RvBJnXw7cQwEtest';
export const DEFAULT_INITIAL_VIRTUAL_TOKEN_RESERVES = new BN(1_073_000_000_000_000);
export const DEFAULT_INITIAL_VIRTUAL_SOL_RESERVES = new BN(30_000_000_000);
export const DEFAULT_INITIAL_REAL_TOKEN_RESERVES = new BN(793_100_000_000_000);
export const DEFAULT_TOKEN_TOTAL_SUPPLY = new BN(1_000_000_000_000_000);
export const DEFAULT_FEE_BASIS_POINTS = new BN(70);
export const DEFAULT_POOL_MIGRATION_FEE = new BN(100_000_000);

// Admin keypair that matches the on-chain authority set by initialize
export function loadAdminKeypair(): Keypair {
  const file = path.join(__dirname, '../tests/keysample/1RHQwsaL5FT5URkZgumxaCHp8LHYMDwgLUPKhRptest.json');
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(file, 'utf-8'))));
}

// Network follows ANCHOR_PROVIDER_URL and wallet follows ANCHOR_WALLET (both from .env)
export function getProgram() {
  const provider = AnchorProvider.env();
  setProvider(provider);
  const program = new Program<Pumpfun>(idl as Pumpfun, provider);
  return { provider, program, connection: provider.connection as Connection, user: provider.wallet.publicKey };
}

export function getConfigPda(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from(SEED_GLOBAL)], programId)[0];
}

export function getBondingCurvePda(mint: PublicKey, programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from(SEED_BONDING_CURVE), mint.toBuffer()], programId)[0];
}

export async function fetchGlobal(program: Program<Pumpfun>): Promise<Global> {
  return (await program.account.global.fetch(getConfigPda(program.programId), 'processed')) as unknown as Global;
}

export async function fetchBondingCurve(program: Program<Pumpfun>, mint: PublicKey): Promise<BondingCurve> {
  const pda = getBondingCurvePda(mint, program.programId);
  const info = await program.provider.connection.getAccountInfo(pda);
  if (!info) throw new Error(`Bonding curve not found for mint ${mint.toBase58()}. Run "yarn script launch" first.`);
  return (await program.account.bondingCurve.fetch(pda, 'processed')) as unknown as BondingCurve;
}

export function getRandomFeeRecipient(list: PublicKey[]): PublicKey {
  return list[Math.floor(Math.random() * list.length)];
}

// Decimal string to base units, using BN so large values don't lose precision
function decimalToBaseUnits(input: string, decimals: number, label: string): BN {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(input.trim());
  if (!match) throw new Error(`Invalid ${label} amount: ${input}`);
  const [, whole, frac = ''] = match;
  if (frac.length > decimals) throw new Error(`${label} amount has more than ${decimals} decimals: ${input}`);
  const base = new BN(whole).mul(new BN(10).pow(new BN(decimals))).add(new BN((frac + '0'.repeat(decimals)).slice(0, decimals) || '0'));
  if (base.isZero()) throw new Error(`Invalid ${label} amount: ${input}`);
  return base;
}

// Base units to a copy-friendly decimal string, e.g. 17590163934426 (6 decimals) -> 17590163.934426
export function formatUnits(amount: BN, decimals: number): string {
  let digits = amount.toString();
  while (digits.length <= decimals) digits = '0' + digits;
  const whole = digits.slice(0, digits.length - decimals);
  const frac = digits.slice(digits.length - decimals).replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole;
}

export function solToLamports(sol: string): BN {
  return decimalToBaseUnits(sol, 9, 'SOL');
}

export function tokenToBaseUnits(token: string): BN {
  return decimalToBaseUnits(token, TOKEN_DECIMALS, 'token');
}

// Same math as tests/utils.ts
function ceilDiv(a: BN, b: BN): BN {
  return a.add(b.subn(1)).div(b);
}

export function fee(amount: BN, feeBasisPoints: BN): BN {
  return ceilDiv(amount.mul(feeBasisPoints), new BN(10_000));
}

export function solCost(minAmount: BN, virtualTokenReserves: BN, virtualSolReserves: BN): BN {
  return minAmount.mul(virtualSolReserves).div(virtualTokenReserves.sub(minAmount)).add(new BN(1));
}

export function tokenReceived(inputAmount: BN, virtualTokenReserves: BN, virtualSolReserves: BN): BN {
  return inputAmount.mul(virtualTokenReserves).div(virtualSolReserves.add(inputAmount));
}

export function solReceived(inputAmount: BN, virtualTokenReserves: BN, virtualSolReserves: BN): BN {
  return inputAmount.mul(virtualSolReserves).div(virtualTokenReserves.add(inputAmount));
}
