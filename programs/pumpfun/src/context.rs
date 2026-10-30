
use anchor_lang::{prelude::*, system_program};
use anchor_spl::{associated_token::{self, AssociatedToken}, 
// memo::spl_memo, 
metadata::Metadata, token::{self, Mint, Token, TokenAccount},
//  token_2022::Token2022
};
// use raydium_locking_cpi::{LOCK_CP_AUTH_SEED, program::RaydiumLiquidityLocking};
use crate::{ errors::PumpfunError, states::{
    // AUTH_SEED, AUTHORITY, POOL_LP_MINT_SEED, POOL_VAULT_SEED, 
    BONDINGCURVE_PREFIX, BondingCurve, GLOBAL_PREFIX, Global, METADATA_PREFIX, MINTAUTHORITY_PREFIX, 
    TOKEN_DECIMAL}};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        seeds = [GLOBAL_PREFIX.as_bytes()],
        constraint = !global.initialized @ PumpfunError::AlreadyInitialized,
        space = 8 + Global::LEN,
        bump,
    )]

    pub global: Box<Account<'info, Global>>,

    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
}

#[event_cpi]
#[derive(Accounts)]
pub struct SetParams<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_PREFIX.as_bytes()],
        constraint = global.initialized @ PumpfunError::NotInitialized,
        bump,
    )]
    pub global: Box<Account<'info, Global>>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[event_cpi]
#[derive(Accounts)]
pub struct Create<'info> {
    #[account(
        init,
        payer = user,
        mint::decimals = TOKEN_DECIMAL,
        mint::authority = mint_authority.key(),
    )]
    pub mint: Box<Account<'info, Mint>>,

    /// CHECK: PDA used as mint authority signer
    #[account(seeds = [MINTAUTHORITY_PREFIX.as_bytes()], bump)]
    pub mint_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + BondingCurve::LEN,
        seeds = [BONDINGCURVE_PREFIX.as_bytes(), &mint.key().to_bytes()],
        bump
    )]
    pub bonding_curve: Box<Account<'info, BondingCurve>>,

    #[account(
        init,
        payer = user,
        associated_token::mint = mint,
        associated_token::authority = bonding_curve
    )]
    pub associated_bonding_curve: Box<Account<'info, TokenAccount>>,

    #[account(seeds = [GLOBAL_PREFIX.as_bytes()], bump)]
    pub global: Box<Account<'info, Global>>,

    /// CHECK: Metaplex Token Metadata program
    pub mpl_token_metadata: Program<'info, Metadata>,

    /// CHECK: PDA derived by Metaplex program for this mint
    #[account(
        mut,
        seeds = [
            METADATA_PREFIX.as_bytes(),
            mpl_token_metadata.key.as_ref(),
            mint.to_account_info().key.as_ref()
        ],
        seeds::program = mpl_token_metadata.key(),
        bump,
    )]
    pub metadata: UncheckedAccount<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: system / token / associated_token / rent
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[event_cpi]
#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(
        seeds = [GLOBAL_PREFIX.as_bytes()],
        constraint = global.initialized @ PumpfunError::NotInitialized,
        bump,
    )]
    pub global: Box<Account<'info, Global>>,

    /// CHECK: validated against global.fee_recipients
    #[account(
        mut,
        constraint = global.fee_recipients.contains(fee_recipient.key) @ PumpfunError::IncorrectFeeRecipient
    )]
    pub fee_recipient: UncheckedAccount<'info>,

    #[account()]
    pub mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds = [BONDINGCURVE_PREFIX.as_bytes(), &mint.key().to_bytes()],
        constraint = !bonding_curve.complete @ PumpfunError::BondingCurveComplete,
        bump
    )]
    pub bonding_curve: Box<Account<'info, BondingCurve>>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = bonding_curve
    )]
    pub associated_bonding_curve: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
    )]
    pub associated_user: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub user: Signer<'info>,
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
}

#[event_cpi]
#[derive(Accounts)]
pub struct WithdrawParams<'info> {
    #[account(seeds = [GLOBAL_PREFIX.as_bytes()], constraint = global.initialized @ PumpfunError::NotInitialized, bump)]
    pub global: Box<Account<'info, Global>>,
    #[account(mut, constraint = global.withdraw_authority == withdraw_authority.key() @ PumpfunError::NotAuthorized)]
    pub withdraw_authority: Signer<'info>,
    /// CHECK: Must be the canonical wrapped SOL mint.
    #[account(address = anchor_spl::token::spl_token::native_mint::ID)]
    pub token_0_mint: UncheckedAccount<'info>,
    pub token_1_mint: Box<Account<'info, Mint>>,
    #[account(mut, seeds = [BONDINGCURVE_PREFIX.as_bytes(), token_1_mint.key().as_ref()], bump)]
    pub bonding_curve: Box<Account<'info, BondingCurve>>,
    #[account(mut, associated_token::mint = token_1_mint, associated_token::authority = bonding_curve)]
    pub curve_token_account: Box<Account<'info, TokenAccount>>,
    /// CHECK: lamports are sent only to the authorized signer.
    #[account(mut, address = withdraw_authority.key())]
    pub creator_0_ata: UncheckedAccount<'info>,
    #[account(mut, associated_token::mint = token_1_mint, associated_token::authority = withdraw_authority)]
    pub creator_1_ata: Box<Account<'info, TokenAccount>>,
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
}

