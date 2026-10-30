import * as assert from 'assert';
import { BN } from '@anchor-lang/core';
import { PublicKey } from '@solana/web3.js';
import { withdrawKp, globalConfigPda, programPumpfun, list_fee_recipients } from '../constant';
import { setParams } from '../instruction';
describe('setparams test', () => {
  it('Is correctly set params', async () => {
    const fee_recipients = list_fee_recipients.map((address) => new PublicKey(address));

    const initial_virtual_token_reserves = new BN(1_073_000_000_000_000);
    const initial_virtual_sol_reserves = new BN(30_000_000_000);
    const initial_real_token_reserves = new BN(793_100_000_000_000);
    const token_total_supply = new BN(100_000_000_000_0000);
    const fee_basis_points = new BN(70); //0.7%

    const withdraw_authority = withdrawKp.publicKey;
    const enable_migrate = true;
    const pool_migration_fee = new BN(100_000_000);
    await setParams(
      programPumpfun,
      fee_recipients,
      initial_virtual_token_reserves,
      initial_virtual_sol_reserves,
      initial_real_token_reserves,
      token_total_supply,
      fee_basis_points,
      withdraw_authority,
      enable_migrate,
      pool_migration_fee,
    );
    const config = await programPumpfun.account.global.fetch(globalConfigPda, 'processed');
    assert.equal(config.feeBasisPoints.toString(), fee_basis_points.toString());
    assert.equal(config.withdrawAuthority.toString(), withdraw_authority.toString());
    assert.equal(config.poolMigrationFee.toString(), pool_migration_fee.toString());
  });
});
