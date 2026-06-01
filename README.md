# Auric (AUR)

A minimal ERC-20 token built with Foundry and OpenZeppelin Contracts v5, deployed to Ethereum Sepolia.

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

| Field | Value |
|---|---|
| Network | Ethereum Sepolia |
| Contract | `0x650b1AdD632D1a3f09168FdF617F65d8D88d88db` |
| Etherscan | [View token](https://sepolia.etherscan.io/token/0x650b1AdD632D1a3f09168FdF617F65d8D88d88db) |
| Sourcify | [View verification](https://sourcify.dev/#/lookup/0x650b1AdD632D1a3f09168FdF617F65d8D88d88db) |
| Deploy tx | `0x3bc9e95fab3ec6f6a92a18968c022e84527c7cb2e4d4188d450b91c2b6577fdf` |
| Block | 10969615 |
| Gas paid | 0.00122975 ETH |

## Stack

- Solidity `^0.8.20`
- [Foundry](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts v5](https://docs.openzeppelin.com/contracts/5.x/)

## Project Structure

```
src/Auric.sol          # Token contract
test/Auric.t.sol       # Forge tests (14 passing)
script/Deploy.s.sol    # Deployment script
```

## Usage

```bash
# Install dependencies
forge install

# Compile
forge build

# Run tests
forge test

# Run tests with verbose output
forge test -vvv

# Deploy to Sepolia
forge script script/Deploy.s.sol \
  --rpc-url sepolia \
  --broadcast \
  --verify
```

## License

MIT
