import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';

export interface Global {
  // unused
  initialized: boolean;
  authority: PublicKey;
  feeRecipients: PublicKey[];
  initialVirtualTokenReserves: BN;
  initialVirtualSolReserves: BN;
  initialRealTokenReserves: BN;
  tokenTotalSupply: BN;
  feeBasisPoints: BN;
}
export interface BondingCurve {
  virtualTokenReserves: BN;
  virtualSolReserves: BN;
  realTokenReserves: BN;
  realSolReserves: BN;
  tokenTotalSupply: BN;
  complete: boolean;
}

export interface Fees {
  lpFeeBps: BN;
  protocolFeeBps: BN;
}
