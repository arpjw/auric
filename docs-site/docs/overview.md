---
id: overview
title: Overview
slug: /
sidebar_position: 1
---

# Auric — Project Overview

Auric is a learning project that implements a minimal but complete DeFi primitive stack on Ethereum. It is not production-ready; the goal is to demonstrate how the core building blocks of DeFi compose in a single codebase.

## Contracts

| Contract | File | Purpose |
|---|---|---|
| `Auric` | `src/Auric.sol` | ERC-20 token with transfer tax and owner-controlled mint |
| `TokenVesting` | `src/TokenVesting.sol` | Linear vesting with cliff for any ERC-20 |
| `AuricAMM` | `src/AuricAMM.sol` | Constant-product AUR/ETH AMM with 0.3% swap fee |

## Tech Stack

| Layer | Technology |
|---|---|
| Smart contracts | Solidity `^0.8.20`, Foundry, OpenZeppelin Contracts v5 |
| Testing | Forge (Foundry) |
| Frontend | Next.js, wagmi, viem |
| Network | Ethereum Sepolia testnet |

## Deployed Token

| Field | Value |
|---|---|
| Token | Auric (AUR) |
| Address | `0x650b1AdD632D1a3f09168FdF617F65d8D88d88db` |
| Network | Sepolia (chain ID 11155111) |
| Etherscan | https://sepolia.etherscan.io/token/0x650b1AdD632D1a3f09168FdF617F65d8D88d88db |

Only the Auric token is deployed to Sepolia. TokenVesting and AuricAMM are deployed on demand (see [Deployment](deployment)).
