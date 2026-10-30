import { connection, globalConfigPda, programPumpfun, userKp, withdrawKp, adminKp } from '../constant';
import { assert } from 'chai';
import { prepareWallet } from '../utils';
describe('intialize test', () => {
  before(async () => {
    await prepareWallet(connection);
  });
  it('reproduces first-caller authority assignment', async () => {
    await programPumpfun.methods
      .initialize()
      .accounts({
        admin: userKp.publicKey,
      })
      .signers([userKp])
      .rpc();

    const configAccount = await programPumpfun.account.global.fetch(globalConfigPda, 'processed');
    assert.isTrue(configAccount.initialized);
    assert.notEqual(configAccount.authority.toBase58(), userKp.publicKey.toBase58());
    assert.equal(configAccount.authority.toBase58(), adminKp.publicKey.toBase58());
    assert.equal(configAccount.withdrawAuthority.toBase58(), withdrawKp.publicKey.toBase58());
  });
});
