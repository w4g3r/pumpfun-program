use anchor_lang::prelude::*;

#[error_code]
pub enum PumpfunError {
    #[msg("The given account is not authorized to execute this instruction.")]
    NotAuthorized, // 6000

    #[msg("The program is already initialized.")]
    AlreadyInitialized, // 6001

    #[msg("slippage: Too much SOL required to buy the given amount of tokens.")]
    TooMuchSolRequired, // 6002

    #[msg("slippage: Too little SOL received to sell the given amount of tokens.")]
    TooLittleSolReceived, // 6003

    #[msg("The mint does not match the bonding curve.")]
    MintDoesNotMatchBondingCurve, // 6004

    #[msg("The bonding curve has completed and liquidity migrated to raydium.")]
    BondingCurveComplete, // 6005

    #[msg("The bonding curve has not completed.")]
    BondingCurveNotComplete, // 6006

    #[msg("The program is not initialized.")]
    NotInitialized, // 6007

    #[msg("initial_real_token_reserves should be less than token_total_supply")]
    InitialRealTokenReservesShouldBeLessThanTokenTotalSupply, // 6011

    #[msg("initial_virtual_token_reserves should be greater than initial_real_token_reserves")]
    InitialVirtualTokenReservesShouldBeGreaterThanInitialRealTokenReserves, // 6012

    #[msg("fee_basis_points greater than maximum (1000)")]
    FeeBasisPointsGreaterThanMaximum, // 6013

    #[msg("Withdraw authority cannot be set to System Program ID")]
    AllZerosWithdrawAuthority, // 6014

    #[msg("pool_migration_fee should be less than final_real_sol_reserves")]
    PoolMigrationFeeShouldBeLessThanFinalRealSolReserves, // 6015

    #[msg("Withdraw instruction is disabled")]
    DisabledWithdraw, // 6017

    #[msg("Migrate instruction is disabled")]
    DisabledMigrate, // 6018

    #[msg("Can't migrate empty token")]
    EmptyMigrate, // 6018

    #[msg("Token already migrated")]
    AlreadyMigrate, // 6018

    #[msg("Buy zero amount")]
    BuyZeroAmount, // 6020

    #[msg("Zero fee claimed")]
    ZeroFeeClaimed, // 6020

    #[msg("Not enough tokens to buy")]
    NotEnoughTokensToBuy, // 6021

    #[msg("Sell zero amount")]
    SellZeroAmount, // 6022

    #[msg("Not enough tokens to sell")]
    NotEnoughTokensToSell, // 6023

    #[msg("Overflow")]
    Overflow, // 6024

    #[msg("All fee recipients should be non-zero")]
    AllFeeRecipientsShouldBeNonZero, // 6028

    #[msg("Not unique fee recipients")]
    NotUniqueFeeRecipients, // 6029

    #[msg("Fee recipient address is not match with the one in the config")]
    IncorrectFeeRecipient,

    #[msg("Amount transfer is 0")]
    AmountZero,

}
