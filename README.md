# Auric (AUR)

A minimal DeFi primitive stack built from first principles for learning. Implements an ERC-20 token with transfer tax, token vesting, and a constant-product AMM — written in Solidity with Foundry and OpenZeppelin v5, deployed to Ethereum Sepolia.

Live: [auric.aryasomu.com](https://auric.aryasomu.com)

---

## Contracts

| Name | File | Purpose |
|---|---|---|
| Auric | `src/Auric.sol` | ERC-20 token (AUR) with configurable transfer tax, owner-only mint, permissionless burn |
| TokenVesting | `src/TokenVesting.sol` | Linear vesting schedule with cliff, beneficiary release, and owner revocation |
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

# Deploy to Sepolia
forge script script/Deploy.s.sol \
  --rpc-url sepolia \
  --broadcast \
  --verify
```

## License

MIT
