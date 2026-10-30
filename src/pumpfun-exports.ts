// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@anchor-lang/core';
import { Cluster, PublicKey } from '@solana/web3.js';
import PumpfunIDL from '../target/idl/pumpfun.json';
import type { Pumpfun } from '../target/types/pumpfun';

// Re-export the generated IDL and type
export { Pumpfun, PumpfunIDL };

// The programId is imported from the program IDL.
export const PUMPFUN_PROGRAM_ID = new PublicKey(PumpfunIDL.address);

// This is a helper function to get the Anchor program.
export function getPumpfunProgram(provider: AnchorProvider, address?: PublicKey): Program<Pumpfun> {
  return new Program(
    { ...PumpfunIDL, address: address ? address.toBase58() : PumpfunIDL.address } as Pumpfun,
    provider,
  );
}

// This is a helper function to get the program ID for the program depending on the cluster.
export function getPumpfunProgramId(cluster: Cluster) {
  switch (cluster) {
    default:
      return PUMPFUN_PROGRAM_ID;
  }
}
