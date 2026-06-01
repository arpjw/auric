# TokenVesting

`src/TokenVesting.sol` — locks any ERC-20 and releases it linearly to a fixed beneficiary.

## Constructor

```solidity
constructor(address _token, address _beneficiary, uint64 _cliffDuration, uint64 _duration)
```

| Parameter | Description |
|---|---|
| `_token` | ERC-20 to vest (typically AUR) |
| `_beneficiary` | Immutable recipient of released tokens |
| `_cliffDuration` | Seconds from deployment until the cliff |
| `_duration` | Total vesting duration in seconds (`>= _cliffDuration`) |

Timestamps are anchored to `block.timestamp` at deploy:

| State var | Value |
|---|---|
| `start` | `block.timestamp` |
| `cliff` | `start + _cliffDuration` |
| `end` | `start + _duration` |

Reverts with `InvalidDuration()` if `_duration == 0` or `_cliffDuration > _duration`.

## Deposit

```solidity
function deposit(uint256 amount) external
```

One-time, one-way. Transfers `amount` tokens from `msg.sender` into the contract. Subsequent calls revert with `AlreadyDeposited()`. Reverts with `ZeroAmount()` if `amount == 0`.

Caller must `approve` this contract before calling.

## Vesting Schedule

```solidity
function vestedAmount(uint64 timestamp) public view returns (uint256)
```

| Time range | Returns |
|---|---|
| `timestamp < cliff` | `0` |
| `cliff <= timestamp < end` | `totalAmount * (timestamp - start) / (end - start)` |
| `timestamp >= end` | `totalAmount` |

Accrual is linear from `start`, not from `cliff`. The cliff makes the entire accrued amount claimable in a lump sum on first release.

**Example:** 1,000 tokens, 30-day cliff, 365-day total. At day 30, `(1000 * 30) / 365 ≈ 82` tokens are immediately claimable.

## Release

```solidity
function release() external
```

Transfers all currently releasable tokens to `beneficiary`. Anyone can call; tokens always go to the fixed beneficiary, never to `msg.sender`.

| Check | Error |
|---|---|
| `block.timestamp < cliff` | `CliffNotReached()` |
| `releasable() == 0` | `NothingToRelease()` |

## State

| Variable | Type | Description |
|---|---|---|
| `totalAmount` | `uint256` | Set by `deposit` |
| `released` | `uint256` | Cumulative tokens already transferred |
| `deposited` | `bool` | Guards against double-deposit |

## Events

| Event | Emitted by |
|---|---|
| `Deposited(address depositor, uint256 amount)` | `deposit` |
| `Released(address beneficiary, uint256 amount)` | `release` |

## Custom Errors

| Error | Condition |
|---|---|
| `AlreadyDeposited()` | Second call to `deposit` |
| `ZeroAmount()` | `deposit(0)` |
| `InvalidDuration()` | `_duration == 0` or `_cliffDuration > _duration` |
| `CliffNotReached()` | `release` called before cliff |
| `NothingToRelease()` | No vested tokens pending release |
