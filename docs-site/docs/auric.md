---
id: auric
title: Auric Token
sidebar_position: 2
---

# Auric ERC-20

`src/Auric.sol` — extends OpenZeppelin `ERC20` + `Ownable`.

## Constructor

```solidity
constructor(address initialOwner, address _treasury)
```

| Parameter | Description |
|---|---|
| `initialOwner` | Receives ownership and the initial 1,000,000 AUR mint |
| `_treasury` | Immutable address that collects transfer tax |

## Token Parameters

| Property | Value |
|---|---|
| Name | Auric |
| Symbol | AUR |
| Decimals | 18 |
| Initial Supply | 1,000,000 AUR minted to `initialOwner` |

## Mint

```solidity
function mint(address to, uint256 amount) external onlyOwner
```

Owner-only. Calls `_mint` directly, bypassing the tax hook (mint is tax-exempt).

## Burn

```solidity
function burn(uint256 amount) external
```

Permissionless. Any holder can burn their own tokens. Calls `_burn` directly — burn is tax-exempt.

## Transfer Tax

All transfers (not mint or burn) are subject to a configurable tax routed to the treasury.

| Constant / State | Value | Description |
|---|---|---|
| `MAX_TAX_BPS` | `1_000` (10%) | Hard cap enforced in `setTaxBps` |
| `taxBps` | `0` default | Current tax rate in basis points |
| `treasury` | immutable | Recipient of collected tax |

### Setting the tax

```solidity
function setTaxBps(uint16 newBps) external onlyOwner
```

Reverts with `TaxTooHigh()` if `newBps > MAX_TAX_BPS`. Emits `TaxUpdated(oldBps, newBps)`.

### Tax calculation

Implemented in `_update`, which overrides the OZ ERC-20 internal hook:

```
tax = value * taxBps / 10_000
net transfer = value - tax
```

Two `_update` calls are made: one to send `tax` to `treasury`, one to send `value - tax` to the intended recipient.

### Tax exemptions

`from == address(0)` → mint (skipped)  
`to == address(0)` → burn (skipped)  
`taxBps == 0` → no tax computed

## Events

| Event | Emitted by |
|---|---|
| `TaxUpdated(uint16 oldBps, uint16 newBps)` | `setTaxBps` |
| Standard ERC-20 `Transfer` / `Approval` | inherited |

## Custom Errors

| Error | Condition |
|---|---|
| `TaxTooHigh()` | `newBps > MAX_TAX_BPS` in `setTaxBps` |
