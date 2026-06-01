# Auric (AUR)

A minimal DeFi primitive stack built from first principles for learning. Implements an ERC-20 token with transfer tax, token vesting, and a constant-product AMM — written in Solidity with Foundry and OpenZeppelin v5, deployed to Ethereum Sepolia.

Live: [auric.aryasomu.com](https://auric.aryasomu.com)

---

## Contracts

| Name | File | Purpose |
|---|---|---|
| Auric | `src/Auric.sol` | ERC-20 token (AUR) with configurable transfer tax, owner-only mint, permissionless burn |
| TokenVesting | `src/TokenVesting.sol` | Linear vesting with cliff, cliff-gated release to a fixed beneficiary |
| AuricAMM | `src/AuricAMM.sol` | Constant-product AMM (x·y=k) for ETH/AUR with LP shares and 0.3% swap fee |

## Token

| Property | Value |
|---|---|
| Name | Auric |
| Symbol | AUR |
| Decimals | 18 |
| Initial Supply | 1,000,000 AUR |
| Mint | Owner only |
| Burn | Any holder |

## Deployment

Network: Ethereum Sepolia

| Contract | Address | Sourcify |
|---|---|---|
| Auric (AUR) | `0x650b1AdD632D1a3f09168FdF617F65d8D88d88db` | [verify](https://sourcify.dev/#/lookup/0x650b1AdD632D1a3f09168FdF617F65d8D88d88db) |
| TokenVesting | `0x5Ae9851eE44175253464C9bb81caB1b5A3b7A9e7` | [verify](https://sourcify.dev/#/lookup/0x5Ae9851eE44175253464C9bb81caB1b5A3b7A9e7) |
| AuricAMM | `0x5F651F54fa97DdB2bb9162061D1a22a693b331be` | [verify](https://sourcify.dev/#/lookup/0x5F651F54fa97DdB2bb9162061D1a22a693b331be) |

Auric token on Etherscan: [sepolia.etherscan.io/token/0x650b…88db](https://sepolia.etherscan.io/token/0x650b1AdD632D1a3f09168FdF617F65d8D88d88db)

TokenVesting parameters: beneficiary = deployer, cliff = 30 days, duration = 180 days.

## Stack

| Layer | Technology |
|---|---|
| Smart contracts | Solidity `^0.8.20` |
| Build & test | Foundry (forge, cast, anvil) |
| Libraries | OpenZeppelin Contracts v5 |
| Frontend | Next.js 15 (App Router) |
| Wallet | wagmi + viem |
| Network | Ethereum Sepolia |

## Tests

91 tests across 3 suites, all passing. Includes fuzz tests for invariant coverage.

| Suite | Tests |
|---|---|
| `AuricTest` | 31 |
| `AuricAMMTest` | 37 |
| `TokenVestingTest` | 23 |

Fuzz tests: `testFuzz_taxNeverExceedsTransferAmount`, `testFuzz_swapETHNeverDecreasesK`, `testFuzz_swapTokensNeverDecreasesK`, `testFuzz_vestedAmountNeverExceedsTotalAndMonotone`

## Project Structure

```
src/
  Auric.sol               # ERC-20 token
  TokenVesting.sol        # Vesting contract
  AuricAMM.sol            # Constant-product AMM
test/
  Auric.t.sol             # 31 tests
  AuricAMM.t.sol          # 37 tests
  TokenVesting.t.sol      # 23 tests
script/
  Deploy.s.sol            # Deploy Auric token
  DeployVesting.s.sol     # Deploy TokenVesting
  DeployAMM.s.sol         # Deploy AuricAMM
web/                      # Next.js frontend
  src/app/
    page.tsx              # Landing page
    app/page.tsx          # Token interface (balance, transfer, mint, burn,
                          #   vesting panel, AMM swap + liquidity)
    docs/                 # Markdown docs
    about/page.tsx        # Project info
  src/components/
    Balance.tsx           # AUR balance display
    Transfer.tsx          # Token transfer
    Mint.tsx              # Owner mint
    Burn.tsx              # Token burn
    Vesting.tsx           # Vesting info + release button
    AMM.tsx               # Swap and liquidity panels
```

## Usage

```bash
# Compile
forge build

# Run tests
forge test

# Verbose output
forge test -vvv

# Local devnet
anvil

# Deploy Auric token
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify

# Deploy TokenVesting (set env vars first)
AUR_TOKEN_ADDRESS=<addr> VESTING_BENEFICIARY=<addr> \
CLIFF_DURATION_SECONDS=2592000 VESTING_DURATION_SECONDS=15552000 \
forge script script/DeployVesting.s.sol --rpc-url sepolia --broadcast --verify

# Deploy AuricAMM
AUR_TOKEN_ADDRESS=<addr> \
forge script script/DeployAMM.s.sol --rpc-url sepolia --broadcast --verify
```

## License

MIT
