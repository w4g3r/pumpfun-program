import * as anchor from '@anchor-lang/core';
import { programPumpfun, token2Kp, userKp } from '../constant';
import { assert } from 'chai';
import { fee, fetchConfigPda, fetchState, getEvent, getFee, solReceived } from '../utils';
import { sell } from '../instruction';
import { BN } from 'bn.js';
import { AccountLayout } from '@solana/spl-token';

describe('sell test', () => {
  it('Is correctly sell', async () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const mint = token2Kp;
    const user = userKp;
    const global = await fetchConfigPda(programPumpfun);
    const isBuy = false;
    const { isNewBondingCurve, bondingCurve, associatedUserAccountInfo } = await fetchState(
      programPumpfun,
      global,
      mint.publicKey,
      user.publicKey,
    );
    if (!associatedUserAccountInfo) throw new Error('Associated User Account is empty');
    const tokenAccount = AccountLayout.decode(associatedUserAccountInfo.data);
    const amount = new BN(tokenAccount.amount);
    const sol_cost = solReceived(amount, bondingCurve.virtualTokenReserves, bondingCurve.virtualSolReserves);
    const min_sol_received = sol_cost.sub(
      getFee({ global, bondingCurve, amount: new BN(sol_cost), isNewBondingCurve }),
    );

    const event = await getEvent(programPumpfun, 'tradeEvent', async () => {
      return await sell(programPumpfun, global, amount, min_sol_received, mint.publicKey, user);
    });
    //validate the sell
    assert.equal(Number(event.solAmount.add(fee(new BN(sol_cost), global.feeBasisPoints))), Number(sol_cost)); //making sure sol received >= than min sol
    const global_fee_recipient = global.feeRecipients.find((addr) => addr.toString() == event.feeRecipient.toString());
    if (!global_fee_recipient) throw new Error('Global fee recipient is undefined');
    assert.equal(event.fee.toNumber(), fee(new BN(sol_cost), global.feeBasisPoints).toNumber());
    assert.equal(event.feeBasisPoints.toNumber(), global.feeBasisPoints.toNumber());
    assert.equal(event.feeRecipient.toString(), global_fee_recipient.toString());
    assert.equal(event.isBuy, isBuy);
    assert.equal(event.mint.toBase58(), mint.publicKey.toBase58());
    assert.equal(event.realSolReserves.toString(), bondingCurve.realSolReserves.sub(sol_cost).toString());
    assert.equal(event.realTokenReserves.toString(), bondingCurve.realTokenReserves.add(event.tokenAmount).toString());
    assert.equal(Number(event.solAmount), Number(min_sol_received));
    assert.equal(event.virtualSolReserves.toString(), bondingCurve.virtualSolReserves.sub(sol_cost).toString());
    assert.equal(event.virtualTokenReserves.toString(), bondingCurve.virtualTokenReserves.add(amount).toString());
    assert.equal(event.tokenAmount.toString(), amount.toString());
    assert.equal(event.user.toBase58(), user.publicKey.toBase58());
  });
});
