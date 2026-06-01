// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// Locks ERC-20 tokens and releases them linearly to a beneficiary.
/// Vesting accrues from `start`; tokens are claimable only after `cliff`.
contract TokenVesting {
    using SafeERC20 for IERC20;

    error AlreadyDeposited();
    error ZeroAmount();
    error InvalidDuration();
    error CliffNotReached();
    error NothingToRelease();

    event Deposited(address indexed depositor, uint256 amount);
    event Released(address indexed beneficiary, uint256 amount);

    IERC20 public immutable token;
    address public immutable beneficiary;
    uint64 public immutable start;
    uint64 public immutable cliff;
    uint64 public immutable end;

    uint256 public totalAmount;
    uint256 public released;
    bool public deposited;

    constructor(address _token, address _beneficiary, uint64 _cliffDuration, uint64 _duration) {
        if (_duration == 0 || _cliffDuration > _duration) revert InvalidDuration();
        token = IERC20(_token);
        beneficiary = _beneficiary;
        start = uint64(block.timestamp);
        cliff = start + _cliffDuration;
        end = start + _duration;
    }

    function deposit(uint256 amount) external {
        if (deposited) revert AlreadyDeposited();
        if (amount == 0) revert ZeroAmount();
        deposited = true;
        totalAmount = amount;
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount);
    }

    /// Returns how many tokens are vested at `timestamp`.
    /// Accrues linearly from start→end; returns 0 before cliff.
    function vestedAmount(uint64 timestamp) public view returns (uint256) {
        if (timestamp < cliff) return 0;
        if (timestamp >= end) return totalAmount;
        return (totalAmount * (timestamp - start)) / (end - start);
    }

    function releasable() public view returns (uint256) {
        return vestedAmount(uint64(block.timestamp)) - released;
    }

    /// Releases all currently vested tokens to the beneficiary.
    /// Callable by anyone; tokens always go to beneficiary.
    function release() external {
        if (block.timestamp < cliff) revert CliffNotReached();
        uint256 amount = releasable();
        if (amount == 0) revert NothingToRelease();
        released += amount;
        token.safeTransfer(beneficiary, amount);
        emit Released(beneficiary, amount);
    }
}
