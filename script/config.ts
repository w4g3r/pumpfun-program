import { PublicKey } from '@solana/web3.js';
import {
  DEFAULT_FEE_BASIS_POINTS,
  DEFAULT_FEE_RECIPIENTS,
  DEFAULT_INITIAL_REAL_TOKEN_RESERVES,
  DEFAULT_INITIAL_VIRTUAL_SOL_RESERVES,
  DEFAULT_INITIAL_VIRTUAL_TOKEN_RESERVES,
  DEFAULT_POOL_MIGRATION_FEE,
  DEFAULT_TOKEN_TOTAL_SUPPLY,
  DEFAULT_WITHDRAW_AUTHORITY,
  getConfigPda,
  getProgram,
  loadAdminKeypair,
} from './common';

// Initialize the global config, then set params (same flow as tests/demo/0 and 1)
export async function config() {
  const { program, connection, user } = getProgram();
  const globalPda = getConfigPda(program.programId);

  if (await connection.getAccountInfo(globalPda)) {
    console.log(`Global config already initialized: ${globalPda.toBase58()}`);
  } else {
    const sig = await program.methods.initialize().accounts({ admin: user }).rpc();
    console.log(`Initialized by ${user.toBase58()}, tx: ${sig}`);
  }

  // set_params only succeeds when signed by the on-chain authority (tests/keysample admin)
  const admin = loadAdminKeypair();
  const sig = await program.methods
    .setParams(
      DEFAULT_FEE_RECIPIENTS.map((address) => new PublicKey(address)),
      DEFAULT_INITIAL_VIRTUAL_TOKEN_RESERVES,
      DEFAULT_INITIAL_VIRTUAL_SOL_RESERVES,
      DEFAULT_INITIAL_REAL_TOKEN_RESERVES,
      DEFAULT_TOKEN_TOTAL_SUPPLY,
      DEFAULT_FEE_BASIS_POINTS,
      new PublicKey(DEFAULT_WITHDRAW_AUTHORITY),
      true,
      DEFAULT_POOL_MIGRATION_FEE,
    )
    .accountsPartial({ global: globalPda, authority: admin.publicKey })
    .signers([admin])
    .rpc();
  console.log(`Params set, tx: ${sig}`);
}
