use crate::{
    errors::PumpfunError,
    events::{CompleteEvent, TradeEvent},
    states::{BondingCurve,},
    Swap,
    utils::{calc_trade, fee, sol_transfer_from_user, token_transfer_user, token_transfer_with_signer},
};
use anchor_lang::{prelude::*};

// ---------- small helpers ----------
#[inline]
fn as_u64(x: u128) -> Result<u64> {
    u64::try_from(x).map_err(|_| PumpfunError::Overflow.into())
}

#[inline]
fn compute_fees(amount: u128, trade_bps: u64) -> (u128, u128) {
    let trading_fee = fee(amount, trade_bps );
    let net = amount.saturating_sub(trading_fee);
    (trading_fee, net)
}

// ---------- unified swap ----------
pub fn swap(
    ctx: Context<Swap>,
    is_buy: bool,       // true: SOL→token, false: token→SOL
    amount_in: u64,     // token amount (ΔT)
    target_sol: u64,    // buy: max SOL to pay, sell: min SOL to receive
) -> Result<()> {
    let global = &ctx.accounts.global;
    let fee_recipient = &mut ctx.accounts.fee_recipient;
    let bonding_curve = &mut ctx.accounts.bonding_curve;
    let user = &mut ctx.accounts.user;
    let mint_key = &ctx.accounts.mint.key();

    // quoted SOL (gross before fees)
    let sol_quote_u128 = calc_trade(
        bonding_curve.virtual_token_reserves,
        bonding_curve.virtual_sol_reserves,
        amount_in,
        is_buy,
    );
    let (trade_fee_u128, sol_net_u128) =
        compute_fees(sol_quote_u128, global.fee_basis_points);

    // quick u64 casts once
    let sol_quote = as_u64(sol_quote_u128)?;
    let trade_fee = as_u64(trade_fee_u128)?;
    let sol_net = as_u64(sol_net_u128)?;

    // --- execute ---
    if is_buy {
        let system_program = &ctx.accounts.system_program.to_account_info();
        let bonding_curve_info = &bonding_curve.to_account_info();
        // user must cover gross (quote + fees)
        let total_cost = sol_quote
            .checked_add(trade_fee)
            .ok_or(PumpfunError::Overflow)?;
        require_gte!(target_sol, total_cost, PumpfunError::TooMuchSolRequired);

        // send tokens from curve to user
        token_transfer_with_signer(
            &ctx.accounts.associated_bonding_curve.to_account_info(),
            &bonding_curve_info,
            &ctx.accounts.associated_user.to_account_info(),
            &ctx.accounts.token_program.to_account_info(),
            &[&BondingCurve::get_signer(&mint_key, &ctx.bumps.bonding_curve)],
            amount_in,
        )?;

        // pay SOL out of user
        sol_transfer_from_user(&user, &bonding_curve_info, &system_program, sol_quote)?;
        sol_transfer_from_user(&user, &fee_recipient, &system_program, trade_fee)?;
    } else {
        // user must receive at least target
        require_gte!(sol_net, target_sol, PumpfunError::TooLittleSolReceived);

        // settle SOL by lamports moves from curve PDA
        **bonding_curve.to_account_info().try_borrow_mut_lamports()? = bonding_curve
            .to_account_info()
            .lamports()
            .checked_sub(sol_quote)
            .ok_or(PumpfunError::Overflow)?;
        
        // user sends tokens to curve
        token_transfer_user(
            &ctx.accounts.associated_user.to_account_info(),
            &user,
            &ctx.accounts.associated_bonding_curve.to_account_info(),
            &ctx.accounts.token_program.to_account_info(),
            amount_in,
        )?;

        **user.to_account_info().try_borrow_mut_lamports()? = user.lamports().checked_add(sol_net).ok_or(PumpfunError::Overflow)?;
        **fee_recipient.try_borrow_mut_lamports()? = fee_recipient.lamports().checked_add(trade_fee).ok_or(PumpfunError::Overflow)?;
      }

    // update curve (uses gross SOL quote)
    bonding_curve.update_reserves(is_buy, amount_in, sol_quote)?;

    // single event emit (no duplicate emit_cpi + emit)
    let clock = Clock::get()?;
    let trade_event = TradeEvent {
        mint: mint_key.key(),
        sol_amount: if is_buy { sol_quote } else { sol_net },
        token_amount: amount_in,
        is_buy,
        user: user.key(),
        timestamp: clock.unix_timestamp,
        virtual_sol_reserves: bonding_curve.virtual_sol_reserves,
        virtual_token_reserves: bonding_curve.virtual_token_reserves,
        real_sol_reserves: bonding_curve.real_sol_reserves,
        real_token_reserves: bonding_curve.real_token_reserves,
        fee_recipient: fee_recipient.key(),
        fee_basis_points: global.fee_basis_points,
        fee: trade_fee,
    };

    // ✅ emit for cross-program usage
    emit_cpi!(trade_event);
    // ✅ emit for logs/explorer
    emit!(trade_event);
    if bonding_curve.complete {
        let complete = CompleteEvent {
            user: user.key(),
            mint: *mint_key,
            bonding_curve: bonding_curve.key(),
            timestamp: clock.unix_timestamp,
        };
        emit_cpi!(complete);
        emit!(complete);
    }

    Ok(())
}

pub fn buy(ctx: Context<Swap>, amount: u64, max_sol_cost: u64) -> Result<()> {
    let a = &ctx.accounts;
    require!(a.bonding_curve.real_token_reserves >= amount, PumpfunError::NotEnoughTokensToBuy);
    require!(amount > 0, PumpfunError::BuyZeroAmount);
    swap(ctx, true, amount, max_sol_cost)
}

pub fn sell(ctx: Context<Swap>, amount: u64, min_sol_output: u64) -> Result<()> {
    let a = &ctx.accounts;
    require!(a.associated_user.amount >= amount, PumpfunError::NotEnoughTokensToSell);
    require!(amount > 0, PumpfunError::SellZeroAmount);
    swap(ctx, false, amount, min_sol_output)
}
