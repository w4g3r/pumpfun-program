import { programPumpfun, TEST_NAME, TEST_SYMBOL, TEST_URI, tokenKp, userKp } from '../constant';
import { assert } from 'chai';
import { fetchConfigPda, getBondingCurve, getEvent } from '../utils';
import { create } from '../instruction';

describe('create test', () => {
  // Configure the client to use the local cluster.
  it('Is correctly create token', async () => {
    const mint = tokenKp;
    const user = userKp;
    const config = await fetchConfigPda(programPumpfun);
    const event = await getEvent(programPumpfun, 'createEvent', async () => {
      return await create(programPumpfun, TEST_NAME, TEST_SYMBOL, TEST_URI, mint, user);
    });
    //validate the buy
    assert.equal(event.user.toBase58(), user.publicKey.toBase58());
    assert.equal(event.name, TEST_NAME);
    assert.equal(event.symbol, TEST_SYMBOL);
    assert.equal(event.uri, TEST_URI);
    assert.equal(event.mint.toBase58(), mint.publicKey.toBase58());
    assert.equal(event.bondingCurve.toBase58(), getBondingCurve(mint.publicKey, programPumpfun.programId).toBase58());
    assert.equal(event.virtualSolReserves.toString(), config.initialVirtualSolReserves.toString());
    assert.equal(event.virtualTokenReserves.toString(), config.initialVirtualTokenReserves.toString());
    assert.equal(event.tokenTotalSupply.toString(), config.tokenTotalSupply.toString());
    assert.equal(event.realTokenReserves.toString(), config.initialRealTokenReserves.toString());
  });
});
