use crate::{
    states::MINTAUTHORITY_PREFIX, events::CreateEvent,  Create
};
use anchor_lang::{prelude::*};
use anchor_spl::{
    metadata::{self, mpl_token_metadata::types::{Creator, DataV2}},
    token::{self, spl_token::instruction::AuthorityType},
};

pub fn create(
    ctx: Context<Create>,
    // metadata
    name: String,
    symbol: String,
    uri: String,
) -> Result<()> {
    // init bonding curve pda
    let bc = &mut ctx.accounts.bonding_curve;
    let g  = &ctx.accounts.global;
    bc.virtual_token_reserves = g.initial_virtual_token_reserves;
    bc.virtual_sol_reserves   = g.initial_virtual_sol_reserves;
    bc.real_token_reserves    = g.initial_real_token_reserves;
    bc.real_sol_reserves      = 0;
    bc.token_total_supply     = g.token_total_supply;
    bc.complete               = false;
    let mint_info = ctx.accounts.mint.to_account_info();
    let mint_authority_info = ctx.accounts.mint_authority.to_account_info();

    // signer seeds (mint authority PDA)
    let signer_seeds: &[&[&[u8]]] = &[
        &[MINTAUTHORITY_PREFIX.as_bytes(), &[ctx.bumps.mint_authority]],
    ];

    // token metadata
    let creator_md = Creator { address: ctx.accounts.user.key(), verified: false, share: 100 };

    metadata::create_metadata_accounts_v3(
        CpiContext::new_with_signer(
            ctx.accounts.mpl_token_metadata.to_account_info(),
            metadata::CreateMetadataAccountsV3 {
                metadata:        ctx.accounts.metadata.to_account_info(),
                mint:            mint_info.clone(),
                mint_authority:  mint_authority_info.clone(),
                payer:           ctx.accounts.user.to_account_info(),
                update_authority:mint_authority_info.clone(),
                system_program:  ctx.accounts.system_program.to_account_info(),
                rent:            ctx.accounts.rent.to_account_info(),
            },
            signer_seeds,
        ),
        DataV2 {
            name:   name.clone(),
            symbol: symbol.clone(),
            uri:    uri.clone(),
            seller_fee_basis_points: 0,
            creators:  Some(vec![creator_md]),
            collection: None,
            uses:       None,
        },
        false,  // is_mutable
        true,   // update_authority_is_signer
        None,   // collection_details
    )?;

    // mint total supply to bonding curve ATA
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint:     mint_info.clone(),
                to:       ctx.accounts.associated_bonding_curve.to_account_info(),
                authority:mint_authority_info.clone(),
            },
            signer_seeds,
        ),
        g.token_total_supply,
    )?;

    // revoke mint authority
    token::set_authority(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::SetAuthority {
                current_authority: mint_authority_info,
                account_or_mint:   mint_info,
            },
            signer_seeds,
        ),
        AuthorityType::MintTokens,
        None,
    )?;

    // dual-emit (CPI + logs)
    let clock = Clock::get()?;
    let ev = CreateEvent {
        name,
        symbol,
        uri,
        mint:           ctx.accounts.mint.key(),
        bonding_curve:  bc.key(),
        user:           ctx.accounts.user.key(),
        timestamp:      clock.unix_timestamp,
        virtual_token_reserves: g.initial_virtual_token_reserves,
        virtual_sol_reserves:   g.initial_virtual_sol_reserves,
        real_token_reserves:    g.initial_real_token_reserves,
        token_total_supply:     g.token_total_supply,
    };
    emit_cpi!(ev);
    emit!(ev);

    Ok(())
}
