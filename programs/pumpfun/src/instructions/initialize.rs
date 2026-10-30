
use crate::{ Initialize};
use anchor_lang::{prelude::*};


pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let global = &mut ctx.accounts.global;
    // Update fields
    global.initialized = true;

    global.authority = pubkey!("1RHQwsaL5FT5URkZgumxaCHp8LHYMDwgLUPKhRptest");

    global.fee_recipients = [
    pubkey!("9xav9CigN9QzAjxGNwWEvvddFmxo5gkQd6w2reiTNgVm"),
    pubkey!("5pepkfQj887QENkWnbfTcfTeXkER1KzQCKJ9euKNzRn2"),
    pubkey!("6FWZirP5UwfZ6toGpiej4FkWsTABjE9J7uKZum2GqkE9"),
    pubkey!("6Jk7DbJ7T1VFR92CRLecyCRTsmzaCQUfoCMvxxdhHyGv"),
    pubkey!("C9KYvaxoxQdW8geojusiTcNLFWoZs5wyPtkcKfppRo4c"),
    pubkey!("H5PG6axx8YLTRXmj87dEqDrxUUXPveWymnzjUr2PKYU8"),
    pubkey!("9mwXYT3QP9a7jaGVTZm58fccUJo4iDTomUU3QP9VSmKm"),
    pubkey!("6ubHQmt9xDV4MVrmUarjR9WiafxduKBcj7bbsHxQ8dsd"),
];
    global.initial_virtual_token_reserves = 1_073_000_000_000_000;
    global.initial_virtual_sol_reserves = 30_000_000_000;
    global.initial_real_token_reserves = 793_100_000_000_000;
    global.token_total_supply = 1_000_000_000_000_000;

    global.fee_basis_points = 100; //in basis points (1%)
    
    global.pool_migration_fee = 150_000_000;
    global.withdraw_authority = pubkey!("3g2ww1F3XRK1FnReCULuEADbmK16RvBJnXw7cQwEtest");
   
    global.enable_migrate = true;

    Ok(())
}
