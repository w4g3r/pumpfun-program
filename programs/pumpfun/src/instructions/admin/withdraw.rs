use crate::{WithdrawParams, errors::PumpfunError, states::BondingCurve, utils::{ token_transfer_with_signer}};
use anchor_lang::{prelude::*};


pub fn withdraw(
    ctx: Context<WithdrawParams>, 
) -> Result<()> {
    let global = &ctx.accounts.global;
    let bonding = &ctx.accounts.bonding_curve;
    require!(global.enable_migrate, PumpfunError::DisabledMigrate);
    require!(bonding.complete, PumpfunError::BondingCurveNotComplete);

    let curve_pda= &mut bonding.to_account_info();
    let current_lamports = **curve_pda.lamports.borrow();
    let transferable = current_lamports.saturating_sub(Rent::get()?.minimum_balance(curve_pda.data_len()));
    let init_amount_0 = ctx.accounts.curve_token_account.amount;
    require!(init_amount_0 > 0, PumpfunError::AlreadyMigrate);
    require!(transferable > 0, PumpfunError::EmptyMigrate);
    require_keys_eq!(ctx.accounts.token_0_mint.key(), anchor_spl::token::spl_token::native_mint::ID, PumpfunError::MintDoesNotMatchBondingCurve);
    require!(ctx.accounts.token_1_mint.key() == ctx.accounts.curve_token_account.mint, PumpfunError::MintDoesNotMatchBondingCurve);
    // withdrawing token first
    token_transfer_with_signer(
        &ctx.accounts.curve_token_account.to_account_info(),
        curve_pda,
        &ctx.accounts.creator_1_ata.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
        &[&BondingCurve::get_signer(&ctx.accounts.token_1_mint.key(), &ctx.bumps.bonding_curve)],
       init_amount_0 ,
    )?;
    // next withdrawing the solana from pda
    **curve_pda.try_borrow_mut_lamports()? -= transferable;
    **ctx.accounts.creator_0_ata.to_account_info().try_borrow_mut_lamports()? += transferable;

    Ok(())
}
