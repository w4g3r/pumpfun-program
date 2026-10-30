import { Keypair } from '@solana/web3.js';
import { DEFAULT_NAME, DEFAULT_SYMBOL, DEFAULT_URI, getProgram } from './common';

export interface LaunchOptions {
  name?: string;
  symbol?: string;
  uri?: string;
}

// Create a new token with a fresh mint keypair; the mint address is printed for buy/sell
export async function launch(options: LaunchOptions = {}) {
  const { program, user } = getProgram();
  const mint = Keypair.generate();

  const sig = await program.methods
    .create(options.name ?? DEFAULT_NAME, options.symbol ?? DEFAULT_SYMBOL, options.uri ?? DEFAULT_URI)
    .accountsPartial({ mint: mint.publicKey, user })
    .signers([mint])
    .rpc();

  console.log(`Token launched by ${user.toBase58()}`);
  console.log(`Mint: ${mint.publicKey.toBase58()}`);
  console.log(`tx: ${sig}`);
}