import { programPumpfun, token2Kp, user2Kp } from '../constant';
import { assert } from 'chai';
import { fee, fetchConfigPda, fetchState, getEvent, getFee, solCost, tokenReceived } from '../utils';
import { buy } from '../instruction';
import { BN } from 'bn.js';

describe('buy test', () => {
  it('Is correctly buy', async () => {
    const mint = token2Kp;
    const user = user2Kp;
    const global = await fetchConfigPda(programPumpfun);
    const isBuy = true;
    const { isNewBondingCurve, bondingCurve } = await fetchState(
      programPumpfun,
      global,
      mint.publicKey,
      user.publicKey,
    );
    const min = 40.1;
    const max = 85.0;
    const rand = Math.random() * (max - min) + min; // in [0.1, 1)
    const initial_sol = new BN(rand * 1e9);
    const amount = tokenReceived(initial_sol, bondingCurve.virtualTokenReserves, bondingCurve.virtualSolReserves);
    // const amount = bondingCurve.realTokenReserves;
    const sol_cost = solCost(amount, bondingCurve.virtualTokenReserves, bondingCurve.virtualSolReserves);
    const max_sol_cost = sol_cost.add(getFee({ global, bondingCurve, amount: new BN(sol_cost), isNewBondingCurve }));

    const event = await getEvent(programPumpfun, 'tradeEvent', async () => {
      return await buy(programPumpfun, global, amount, max_sol_cost, mint.publicKey, user);
    });
    //validate the buy
    const global_fee_recipient = global.feeRecipients.find((addr) => addr.toString() == event.feeRecipient.toString());
    if (!global_fee_recipient) throw new Error('Global fee recipient is undefined');
    assert.equal(Number(event.solAmount.add(event.fee)), Number(max_sol_cost)); //making sure sol used <= than max sol
    assert.equal(event.fee.toNumber(), fee(new BN(sol_cost), global.feeBasisPoints).toNumber());
    assert.equal(event.feeBasisPoints.toNumber(), global.feeBasisPoints.toNumber());
    assert.equal(event.feeRecipient.toString(), global_fee_recipient.toString());
    assert.equal(event.isBuy, isBuy);
    assert.equal(event.mint.toBase58(), mint.publicKey.toBase58());
    assert.equal(event.realSolReserves.toString(), bondingCurve.realSolReserves.add(event.solAmount).toString());
    assert.equal(event.realTokenReserves.toString(), bondingCurve.realTokenReserves.sub(event.tokenAmount).toString());
    assert.equal(Number(event.solAmount), Number(sol_cost));
    assert.equal(event.virtualSolReserves.toString(), bondingCurve.virtualSolReserves.add(sol_cost).toString());
    assert.equal(event.virtualTokenReserves.toString(), bondingCurve.virtualTokenReserves.sub(amount).toString());
    assert.equal(event.tokenAmount.toString(), amount.toString());
    assert.equal(event.user.toBase58(), user.publicKey.toBase58());
  });
});
