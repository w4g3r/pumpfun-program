// #![deny(unused_imports, unused_variables)]
#![deny(clippy::all)]
#![deny(clippy::panic)]
#![deny(clippy::unwrap_used)]
#![deny(clippy::expect_used)]
#![allow(unexpected_cfgs)]
#![allow(deprecated)]
use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod states;
pub mod utils;
pub mod events;
pub mod context;
pub use context::*;

declare_id!("2EGBWMwreamZaekLPNQbRnVqvdjC1G9tC7j4pUR8vpxR");

#[program]
pub mod pumpfun {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize(ctx)
    }

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
        instructions::set_params(
            ctx,
            fee_recipients,
            initial_virtual_token_reserves,
            initial_virtual_sol_reserves,
            initial_real_token_reserves,
            token_total_supply,
            fee_basis_points,
            withdraw_authority,
            enable_migrate,
            pool_migration_fee,
        )
    }

    pub fn create(
        ctx: Context<Create>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        instructions::create(ctx, name, symbol, uri)
    }

    pub fn buy(ctx: Context<Swap>, amount: u64, max_sol_cost: u64) -> Result<()> {
        instructions::buy(ctx, amount, max_sol_cost)
    }

    pub fn sell(ctx: Context<Swap>, amount: u64, min_sol_output: u64) -> Result<()> {
        instructions::sell(ctx, amount, min_sol_output)
    }

    pub fn withdraw(ctx: Context<WithdrawParams>) -> Result<()> {
        instructions::withdraw(ctx)
    }
}
