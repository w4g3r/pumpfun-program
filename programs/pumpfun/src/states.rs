use anchor_lang::prelude::*;
use crate::errors::PumpfunError;

pub const TOKEN_DECIMAL: u8 = 6;          // token decimal
pub const BONDINGCURVE_PREFIX: &str = "bonding-curve";
pub const GLOBAL_PREFIX: &str = "global";
pub const MINTAUTHORITY_PREFIX: &str = "mint-authority";
pub const METADATA_PREFIX: &str = "metadata";
pub const AUTHORITY: &str = "authority";
pub const WSOL_PREFIX: &str = "wsol";
pub const TOKEN_PREFIX: &str = "token";

#[account]

pub struct BondingCurve {
    //  vitual balances on the curve
    pub virtual_token_reserves: u64,
    pub virtual_sol_reserves: u64,

    //  real balances on the curve
    pub real_token_reserves: u64,
    pub real_sol_reserves: u64,

    //  token supply
    pub token_total_supply: u64,

    //  true - if the curve reached the limit
    pub complete: bool,
}
impl BondingCurve {
    pub const LEN: usize = 8 + 8 + 8 + 8 + 8 + 1;
    //  get signer for bonding curve PDA
    pub fn get_signer<'a>(mint: &'a Pubkey, bump: &'a u8) -> [&'a [u8]; 3] {
        [
            BONDINGCURVE_PREFIX.as_bytes(),
            mint.as_ref(),
            std::slice::from_ref(bump),
        ]
    }

    //  update reserve balance on the curve PDA
    pub fn update_reserves(
        &mut self,
        is_buy: bool,
        new_token_amount: u64,
        new_sol_amount: u64,
    ) -> Result<bool> {

        // Update reserves
        self.virtual_token_reserves = if is_buy {self.virtual_token_reserves.checked_sub(new_token_amount).ok_or(PumpfunError:: Overflow)?} else {self.virtual_token_reserves.checked_add(new_token_amount).ok_or(PumpfunError:: Overflow)?};
        self.virtual_sol_reserves = if is_buy {self.virtual_sol_reserves.checked_add(new_sol_amount).ok_or(PumpfunError:: Overflow)?} else {self.virtual_sol_reserves.checked_sub(new_sol_amount).ok_or(PumpfunError:: Overflow)?};

        // Update real reserves
        self.real_token_reserves = if is_buy {self.real_token_reserves.checked_sub(new_token_amount).ok_or(PumpfunError:: Overflow)?} else {self.real_token_reserves.checked_add(new_token_amount).ok_or(PumpfunError:: Overflow)?};
        self.real_sol_reserves = if is_buy {self.real_sol_reserves.checked_add(new_sol_amount).ok_or(PumpfunError:: Overflow)?} else {self.real_sol_reserves.checked_sub(new_sol_amount).ok_or(PumpfunError:: Overflow)?};
       
        // Check if curve limit is reached
        // 793_100_000_000_000
        if self.real_token_reserves == 0 {
            self.complete = true;
        }
        Ok(false)
    }    
}

#[account]
pub struct Global {
    pub initialized: bool,
    pub authority: Pubkey,     //  authority of the program
    pub fee_recipients: [Pubkey;8], //  team wallet address to receive the fee

    //  curve token/sol amount config
    pub initial_virtual_token_reserves: u64,
    pub initial_virtual_sol_reserves: u64,
    pub initial_real_token_reserves: u64,
    pub token_total_supply: u64,

    //  platform fee percentage
    pub fee_basis_points: u64,
    pub withdraw_authority: Pubkey,
    pub enable_migrate: bool,
    pub pool_migration_fee: u64,
}
impl Global {
    pub const LEGACY_LEN: usize = 32 * 8  //fee_recipients array
    + 8 // discriminator
    + 1 // initialized
    + 32 // authority
    + 8 // initial_virtual_token_reserves
    + 8 // initial_virtual_sol_reserves
    + 8 // initial_real_token_reserves
    + 8 // token_total_supply
    + 8 // fee_basis_points
    + 32 // withdraw_authority
    + 1 // enable_migrate
    + 8 // pool_migration_fee
;
    pub const LEN: usize = Self::LEGACY_LEN + 8 + 8;
}
