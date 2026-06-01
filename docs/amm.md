# AuricAMM

`src/AuricAMM.sol` — toy constant-product (x·y = k) AMM for an AUR/ETH pair.

**NOT AUDITED. Not safe for mainnet.** Intended for learning only.

## Constructor

```solidity
constructor(address _token)
```

Sets the immutable `token` (ERC-20). The contract receives ETH natively.

**Requirement:** Auric's `taxBps` must be `0` when using this pool. Fee-on-transfer tokens break the invariant.

## Pool Model

| State var | Description |
|---|---|
| `reserveToken` | AUR held by the contract |
| `reserveEth` | ETH held by the contract |
| `totalShares` | Sum of all LP shares |
| `shares[addr]` | LP share balance of each address |

LP shares are tracked internally — there is no separate ERC-20 LP token.

## addLiquidity

```solidity
function addLiquidity(uint256 tokenAmount) external payable returns (uint256 sharesOut)
```

Caller sends ETH via `msg.value` and approves `tokenAmount` AUR before calling.

| State | Share minting formula |
|---|---|
| First deposit (`totalShares == 0`) | `sharesOut = sqrt(tokenAmount * ethAmount)` (geometric mean) |
| Subsequent deposits | `sharesOut = ethAmount * totalShares / reserveEth` |

For subsequent deposits, `msg.value` drives the scale. The required token amount is derived from the current ratio (`requiredToken = ethAmount * reserveToken / reserveEth`). If `requiredToken > tokenAmount`, reverts with `SlippageExceeded()` — the caller's `tokenAmount` acts as a slippage cap.

## removeLiquidity

```solidity
function removeLiquidity(uint256 sharesToBurn) external returns (uint256 tokenOut, uint256 ethOut)
```

Burns `sharesToBurn` and returns the proportional share of both reserves:

```
tokenOut = sharesToBurn * reserveToken / totalShares
ethOut   = sharesToBurn * reserveEth   / totalShares
```

Reverts with `InsufficientShares()` if caller holds fewer shares than `sharesToBurn`.

## swapETHForTokens

```solidity
function swapETHForTokens(uint256 minTokenOut) external payable returns (uint256 tokenOut)
```

Sends ETH, receives AUR. Reverts with `SlippageExceeded()` if `tokenOut < minTokenOut`.

## swapTokensForETH

```solidity
function swapTokensForETH(uint256 tokenIn, uint256 minEthOut) external returns (uint256 ethOut)
```

Sends AUR (must be pre-approved), receives ETH. Reverts with `SlippageExceeded()` if `ethOut < minEthOut`.

## Fee Mechanism

**0.3% fee** stays in the pool on every swap. No fee on liquidity add/remove.

```
FEE_NUMERATOR   = 997
FEE_DENOMINATOR = 1000
```

Output formula:

```
amountOut = reserveOut * (amountIn * 997) / (reserveIn * 1000 + amountIn * 997)
```

The full `amountIn` is added to `reserveIn`, but only `amountIn * 997` counts in the numerator. This means `reserveIn * reserveOut` strictly increases after every swap, accruing fee income to LPs proportionally to their shares.

## View

```solidity
function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) external pure returns (uint256)
```

Public wrapper for the output formula. Useful for off-chain quote computation.

## Events

| Event | Emitted by |
|---|---|
| `LiquidityAdded(provider, tokenAmount, ethAmount, sharesOut)` | `addLiquidity` |
| `LiquidityRemoved(provider, tokenAmount, ethAmount, sharesBurned)` | `removeLiquidity` |
| `Swap(user, tokenIn, ethIn, tokenOut, ethOut)` | both swap functions |

## Custom Errors

| Error | Condition |
|---|---|
| `ZeroAmount()` | Zero input in any function |
| `ZeroShares()` | `addLiquidity` produces no shares |
| `InsufficientShares()` | `removeLiquidity` exceeds caller's balance |
| `InsufficientLiquidity()` | Swap attempted on empty pool |
| `SlippageExceeded()` | Output below minimum, or `addLiquidity` ratio exceeded |
| `ETHTransferFailed()` | Low-level ETH send failed in `removeLiquidity` or `swapTokensForETH` |
