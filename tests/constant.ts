import * as anchor from '@anchor-lang/core';
import { BN } from 'bn.js';
import fs from 'fs';
import { Keypair, PublicKey } from '@solana/web3.js';
import { Program } from '@anchor-lang/core';

import { Pumpfun } from '../target/types/pumpfun';
import { getConfigPda } from './utils';

// Seeds
export const SEED_BONDING_CURVE = 'bonding-curve';
export const SEED_GLOBAL = 'global';
export const AUTHORITY = 'authority';

// Test token
export const TEST_NAME = 'test spl token';
export const TEST_SYMBOL = 'TEST';
export const TEST_URI = 'https://ipfs.io/ipfs/QmWVzSC1ZTFiBYFiZZ6QivGUZ9awPJwqZECSFL1UD4gitC';

// Reserves
export const TEST_INITIAL_VIRTUAL_TOKEN_RESERVES = new BN(1_073_000_000_000_000);
export const TEST_INITIVAL_VIRTUAL_SOL_RESERVES = new BN(30_000_000_000);
export const TEST_INITIAL_REAL_TOKEN_RESERVES = new BN(793_100_000_000_000);
export const TEST_TOKEN_TOTAL_SUPPLY = new BN(1_000_000_000_000_000);

// Addresses
export const WSOL_ADDRESS = new PublicKey('So11111111111111111111111111111111111111112');

// Anchor
export const programPumpfun = anchor.workspace.Pumpfun as Program<Pumpfun>;
export const provider = anchor.AnchorProvider.env();
export const connection = provider.connection;
export const globalConfigPda = getConfigPda(programPumpfun.programId);

// Wallet loader
const loadWallet = (address: string): Keypair => {
  const secretKey = JSON.parse(fs.readFileSync(`tests/keysample/${address}.json`, 'utf-8'));

  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
};

// Wallets
export const adminKp = loadWallet('1RHQwsaL5FT5URkZgumxaCHp8LHYMDwgLUPKhRptest');

export const withdrawKp = loadWallet('3g2ww1F3XRK1FnReCULuEADbmK16RvBJnXw7cQwEtest');

export const userKp = loadWallet('3uHsKqGnEYDn3K6SzhrZBNDXgRtmvT54MvrRK4Pftest');

export const user2Kp = loadWallet('5aXE9LDYN2QPm1F2uMVH9kVFhkSvQcCQP3wwVkV1test');

export const tokenKp = loadWallet('8HqbA1UDrgcc2P4mpmzFhzoei4W25ptM2ee78JP3test');

export const token2Kp = loadWallet('ASN71P1Lmhms98ybkBDdcg1Gm1XWVuH2xEKCh3g7test');

// Fee recipients
export const list_fee_recipients = [
  'AXdaFNu6z14YM81otxuFLZjBN5AR5TG2oPySqPcztest',
  'BdeNn7gnAeP34dhT7nRqwmp9EkT31YvNC6LtjXRctest',
  'Dd6DhEeaNN87S9uQqW9dVJoLjKbiNiJtkL1omGVdtest',
  'GGyVzYKcCovDUBkQvZt4azQBHizh61rQc1q36ucCtest',
  'HHGk2TdovrZDGnFfR6GPWumDjA3Fa1NqCuRNnaQRtest',
  'HwMz7stjC8qrTsE66cjdwUBQmP9XcBLGzXYJ63EVtest',
  'JhsipQQBMxSEgtkii8dt46c1qLEdVX2qRcMLJcxtest',
  'pkR6mE7WCpMwzYKF2PzkwMyrDScLuqRGTGN3jzYtest',
];
