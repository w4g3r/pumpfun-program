// use spl_math::precise_number::PreciseNumber;
pub const FEE_RATE_DENOMINATOR_VALUE: u128 = 10_000;


//I don't know but the second function is have the better math
// pub fn calc_trade(
//     vtr: u64,
//     vsr: u64,
//     ta: u64,
//     is_buy: bool, // true for buy, false for sell
// ) -> u128 {
//     let token_amount = PreciseNumber::new(u128::from(ta)).unwrap();
//     let virtual_sol_reserves = PreciseNumber::new(u128::from(vsr)).unwrap();
//     let virtual_token_reserves = PreciseNumber::new(u128::from(vtr)).unwrap();
//     let number_1 = PreciseNumber::new(u128::from(1u128)).unwrap();

//     let sol = if is_buy {
//         token_amount
//             .checked_mul(&virtual_sol_reserves)
//             .and_then(|v| v.checked_div(&virtual_token_reserves.checked_sub(&token_amount)?))
//     } else {
//         token_amount
//             .checked_mul(&virtual_sol_reserves)
//             .and_then(|v| v.checked_div(&virtual_token_reserves.checked_add(&token_amount)?).and_then(|v| v.checked_sub(&number_1)))
//     };

//     sol.and_then(|s| s.to_imprecise())
//         .unwrap_or(0)
//         .max(1) // ✅ never return less than 3
// }

/// Calculate trade amount based on virtual token and sol reserves.
pub fn calc_trade(
    vtr: u64,
    vsr: u64,
    ta: u64,
    is_buy: bool, // true for buy, false for sell
) -> u128 {
    let token_amount = u128::from(ta);
    let virtual_sol_reserves = u128::from(vsr);
    let virtual_token_reserves = u128::from(vtr);
    let sol  = if is_buy == true {  
        token_amount.checked_mul(virtual_sol_reserves).unwrap().checked_div(virtual_token_reserves.checked_sub(token_amount).unwrap()).unwrap().checked_add(1u128)
    }else{
        token_amount.checked_mul(virtual_sol_reserves).unwrap().checked_div(virtual_token_reserves.checked_add(token_amount).unwrap())
    };
    sol.unwrap_or(0).max(1)
}
fn ceil_div(token_amount: u128, fee_numerator: u128, fee_denominator: u128) -> Option<u128> {
    token_amount
        .checked_mul(u128::from(fee_numerator))?
        .checked_add(fee_denominator)?
        .checked_sub(1)?
        .checked_div(fee_denominator)
}
pub fn fee(amount: u128, fee_bps: u64) -> u128 {
    ceil_div(
        amount,
        u128::from(fee_bps),
        u128::from(FEE_RATE_DENOMINATOR_VALUE),
    ).unwrap_or(0).max(1)
}