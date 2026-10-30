# Solana Smart Contract – Pumpfun Clone

A Solana smart contract implementation inspired by Pumpfun, featuring token launches, bonding curve mechanics, and SOL/token swaps.

## Prerequisites

Before using this project, make sure you have installed the following tools:

- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://solana.com/docs/intro/installation)
- [Anchor Framework](https://anchor-lang.com/docs/installation)
- [Node.js](https://nodejs.org/)
- [Yarn](https://yarnpkg.com/)
- [Surfpool](https://surfpool.run/) (optional, recommended for local development)

For detailed installation instructions, refer to the [Anchor installation guide](https://anchor-lang.com/docs/installation).

### Verify Your Installation

Check that all required tools are installed:

```bash
# Check Rust version
rustc --version

# My version: rustc 1.99.0 (b940084d7 2026-09-28)

# Check Solana CLI version
solana --version

# My version: solana-cli 2.3.0 (src:a2e21dda; feat:3640012085, client:Agave)

# Check Anchor version
anchor --version

# My version: anchor-cli 0.32.2

# Check Surfpool version (optional)
surfpool --version
```

> **Note:** These are the versions used during development. Other versions may work, but compatibility is not guaranteed.

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/w4g3r/pumpfun-program.git
cd YOUR_REPOSITORY
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Configure Solana CLI

Set your Solana CLI to use the local development cluster:

```bash
# Check current Solana configuration
solana config get

# Set RPC endpoint to localhost
solana config set --url localhost

# Check the currently configured wallet balance
solana balance
```

If you don't have a wallet yet, generate one:

```bash
solana-keygen new
```

Request some SOL for local development:

```bash
solana airdrop 5
```

These commands assume a local validator is running.

## Quick Start

### 1. Configure Program Addresses

Before building the program, update the addresses in:

```text
programs/pumpfun/src/instructions/initialize.rs
```

Update the following fields with your desired addresses:

| Field                       | Description                    |
| --------------------------- | ------------------------------ |
| `global.authority`          | Global program authority       |
| `global.fee_recipients`     | Fee recipient wallet addresses |
| `global.withdraw_authority` | Withdrawal authority           |

Make sure all addresses are valid Solana public keys.

### 2. Build the Program

Run:

```bash
anchor build
```

If the program keypair does not exist, Anchor will generate one during the build process.

Sync the program ID across the project:

```bash
anchor keys sync
```

If the program ID in `lib.rs` changes, rebuild the program:

```bash
anchor build
```

After a successful build, the generated files can be found here:

```text
target/deploy/pumpfun-keypair.json
target/deploy/pumpfun.so
```

**Important:** Keep your program keypair secure. Never commit private key files to a public repository.

## Local Development

### Run Tests on Localnet

Set the cluster configuration in `Anchor.toml`:

```toml
[provider]
cluster = "Localnet"
```

Start your local validator using either `solana-test-validator` or Surfpool.

Then run the tests:

```bash
anchor test
```

For a validator that is already running, use:

```bash
anchor test --skip-local-validator
```

Make sure the required programs, including the Metaplex Token Metadata program, are available on your local validator.

## Devnet Deployment

### 1. Configure Devnet

Update the provider configuration in `Anchor.toml`:

```toml
[provider]
cluster = "https://api.devnet.solana.com"
```

You can also use your own Devnet RPC endpoint.

### 2. Configure Your Wallet

Make sure your wallet is funded with Devnet SOL:

```bash
solana config set --url devnet
solana balance
```

Request Devnet SOL if needed:

```bash
request on solana website faucet.solana.com
```

### 3. Deploy the Program

Build the program:

```bash
anchor build
```

Deploy it:

```bash
anchor deploy
```

Make sure the wallet configured in Anchor has sufficient SOL to cover deployment costs.

## CLI Usage

The project includes CLI scripts for interacting with the program.

The CLI uses the network and wallet configured through the `.env` file:

```env
ANCHOR_PROVIDER_URL=YOUR_RPC_ENDPOINT
ANCHOR_WALLET=YOUR_WALLET_PATH
```

### Initialize the Program

Initialize the global program configuration:

```bash
yarn script config
```

### Launch a Token

Create a new token:

```bash
yarn script launch
```

### Buy Tokens

Swap SOL for tokens:

```bash
yarn script buy -t <TOKEN_MINT> -a <SOL_AMOUNT>
```

Arguments:

- `-t`: Token mint address. You can get this address after launching a token.
- `-a`: Amount of SOL to spend.

Example:

```bash
yarn script buy -t YOUR_TOKEN_MINT -a 0.1
```

### Sell Tokens

Swap tokens for SOL:

```bash
yarn script sell -t <TOKEN_MINT> -a <TOKEN_AMOUNT>
```

Arguments:

- `-t`: Token mint address.
- `-a`: Amount of tokens to sell.

Example:

```bash
yarn script sell -t YOUR_TOKEN_MINT -a 100000
```

## Local CLI Testing

To run the CLI against localnet:

1. Start `solana-test-validator` or Surfpool.
2. Make sure the required programs are loaded, including Metaplex Token Metadata.
3. Configure `.env` with your local RPC endpoint and wallet path.

Example:

```env
ANCHOR_PROVIDER_URL=http://127.0.0.1:8899
ANCHOR_WALLET=/path/to/your/wallet.json
```

Then run the CLI commands as usual.

## Project Artifacts

After building, the main program artifacts are generated in:

```text
target/
└── deploy/
    ├── pumpfun-keypair.json
    └── pumpfun.so
```

Do not commit private keypairs, wallet files, or `.env` files to GitHub.

## Disclaimer

This project is provided for educational and development purposes. Review and test the smart contract thoroughly before deploying it to Mainnet.

Use at your own risk.
