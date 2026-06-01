# Auric -- Claude Code Context

## Project
ERC-20 token (Auric, AUR) built with Foundry and OpenZeppelin. Deployed to Sepolia testnet.

## Stack
- Foundry (forge, cast, anvil)
- OpenZeppelin Contracts v5
- Solidity ^0.8.20
- Sepolia testnet

## Structure
src/Auric.sol          # Token contract
test/Auric.t.sol       # Forge tests
script/Deploy.s.sol    # Deployment script
.env                   # RPC URL + private key (never commit)

## Token Spec
- Name: Auric
- Symbol: AUR
- Decimals: 18
- Initial Supply: 1,000,000 AUR minted to deployer
- Mint: owner only
- Burn: any holder (own tokens)

## Commands
forge build            # Compile
forge test             # Run tests
forge test -vvv        # Verbose test output
anvil                  # Local devnet
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify  # Deploy

## Key Decisions
- Mint restricted to owner via OpenZeppelin Ownable
- Burn is permissionless (holders burn their own tokens)
- No pausability, no upgradability -- intentionally minimal
- Fixed initial supply at deploy, owner can mint more post-deploy

## Never Commit
- .env
- private keys
- mnemonic phrases
