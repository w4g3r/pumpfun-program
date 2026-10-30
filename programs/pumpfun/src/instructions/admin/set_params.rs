use crate::{ SetParams, errors::PumpfunError};
use anchor_lang::{prelude::*};
use std::collections::HashSet;

#[allow(clippy::too_many_arguments)]
pub fn set_params(
    ctx: Context<SetParams>, 
    fee_recipients: [Pubkey; 8],
    initial_virtual_token_reserves: u64,
    initial_virtual_sol_reserves: u64,
    initial_real_token_reserves: u64,
    token_total_supply: u64,
    fee_basis_points: u64,
    withdraw_authority: Pubkey,
    enable_migrate: bool,
    pool_migration_fee: u64,
) -> Result<()> {
    let global = &mut ctx.accounts.global;

    require!(
        global.authority == Pubkey::default() || global.authority == ctx.accounts.authority.key(),
        PumpfunError::NotAuthorized
    );
    
    require!(
        initial_real_token_reserves < token_total_supply,
        PumpfunError::InitialRealTokenReservesShouldBeLessThanTokenTotalSupply
    );

    // 6012
    require!(
        initial_virtual_token_reserves > initial_real_token_reserves,
        PumpfunError::InitialVirtualTokenReservesShouldBeGreaterThanInitialRealTokenReserves
    );

    // 6013
    require!(
        fee_basis_points <= 10_000,
        PumpfunError::FeeBasisPointsGreaterThanMaximum
    );

    // 6014
    require!(
        withdraw_authority != Pubkey::default(),
        PumpfunError::AllZerosWithdrawAuthority
    );

    // 6015
    let final_real_sol_reserves = initial_virtual_sol_reserves;
    require!(
        pool_migration_fee < final_real_sol_reserves,
        PumpfunError::PoolMigrationFeeShouldBeLessThanFinalRealSolReserves
    );

    // 6028
    for recipient in &fee_recipients {
        require!(
            *recipient != Pubkey::default(),
            PumpfunError::AllFeeRecipientsShouldBeNonZero
        );
    }
    // ✅ Check for duplicates in fee_recipients
    let mut seen = HashSet::new();
    for recipient in fee_recipients {
        require!(seen.insert(recipient), PumpfunError::NotUniqueFeeRecipients);
    }

    // Update all fields except `authority`
    global.fee_recipients = fee_recipients;
    global.initial_virtual_token_reserves = initial_virtual_token_reserves;
    global.initial_virtual_sol_reserves = initial_virtual_sol_reserves;
    global.initial_real_token_reserves = initial_real_token_reserves;
    global.token_total_supply = token_total_supply;
    global.fee_basis_points = fee_basis_points;
    global.withdraw_authority = withdraw_authority;
    global.enable_migrate = enable_migrate;
    global.pool_migration_fee = pool_migration_fee;

    Ok(())
}
