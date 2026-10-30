import {
  programPumpfun,
  TEST_INITIAL_VIRTUAL_TOKEN_RESERVES,
  TEST_INITIVAL_VIRTUAL_SOL_RESERVES,
  TEST_NAME,
  TEST_SYMBOL,
  TEST_URI,
  token2Kp,
  userKp,
} from '../constant';
import { assert } from 'chai';
import { fee, fetchConfigPda, getEvent, getFee, newBondingCurve, solCost, tokenReceived } from '../utils';
import { createAndBuy } from '../instruction';
import { BN } from 'bn.js';

describe('create and buy test', () => {
  // Configure the client to use the local cluster.
  it('Is correctly create token and buy', async () => {
    const mint = token2Kp;
    const user = userKp;
    const global = await fetchConfigPda(programPumpfun);
    const min = 0.1;
    const max = 1.0;
    const rand = Math.random() * (max - min) + min; // in [0.1, 1)
    const initial_sol = new BN(rand * 1e9);
    const isBuy = true;
    const amount = tokenReceived(initial_sol, TEST_INITIAL_VIRTUAL_TOKEN_RESERVES, TEST_INITIVAL_VIRTUAL_SOL_RESERVES);
    const sol_cost = solCost(amount, TEST_INITIAL_VIRTUAL_TOKEN_RESERVES, TEST_INITIVAL_VIRTUAL_SOL_RESERVES);
    const max_sol_cost = sol_cost.add(
      getFee({ global, bondingCurve: newBondingCurve(global), amount: new BN(sol_cost), isNewBondingCurve: true }),
    );

    const event = await getEvent(programPumpfun, 'tradeEvent', async () => {
      return await createAndBuy(
        programPumpfun,
        global,
        TEST_NAME,
        TEST_SYMBOL,
        TEST_URI,
        mint,
        user,
        amount,
        max_sol_cost,
      );
    });
    //validate the buy
    assert.equal(Number(event.solAmount.add(event.fee)), Number(max_sol_cost)); //making sure sol used <= than max sol
    const init_token_reserve =
      Number(global.initialRealTokenReserves.toString()) - Number(event.tokenAmount.toString());
    const global_fee_recipient =
      global.feeRecipients.find((addr) => addr.toString() == event.feeRecipient.toString()) ?? '';
    assert.equal(event.fee.toNumber(), fee(new BN(sol_cost), global.feeBasisPoints).toNumber());
    assert.equal(event.feeBasisPoints.toNumber(), global.feeBasisPoints.toNumber());
    assert.equal(event.feeRecipient.toString(), global_fee_recipient.toString());
    assert.equal(event.isBuy, isBuy);
    assert.equal(event.mint.toBase58(), mint.publicKey.toBase58());
    assert.equal(event.realSolReserves.toString(), event.solAmount.toString());
    assert.equal(event.realTokenReserves.toString(), init_token_reserve.toString());
    assert.equal(Number(event.solAmount), Number(sol_cost));
    assert.equal(event.virtualSolReserves.toString(), TEST_INITIVAL_VIRTUAL_SOL_RESERVES.add(sol_cost).toString());
    assert.equal(event.virtualTokenReserves.toString(), TEST_INITIAL_VIRTUAL_TOKEN_RESERVES.sub(amount).toString());
    assert.equal(event.tokenAmount.toString(), amount.toString());
    assert.equal(event.user.toBase58(), user.publicKey.toBase58());
  });
});
