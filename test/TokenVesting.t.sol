// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Auric} from "../src/Auric.sol";
import {TokenVesting} from "../src/TokenVesting.sol";

contract TokenVestingTest is Test {
    // Re-declare events so vm.expectEmit can match them.
    event Deposited(address indexed depositor, uint256 amount);
    event Released(address indexed beneficiary, uint256 amount);

    Auric public token;
    TokenVesting public vesting;

    address public owner;
    address public beneficiary;
    address public depositor;

    // 90_000 AUR: divisible by 2 and 3 so cliff/halfway checks are exact integers.
    uint256 constant DEPOSIT_AMOUNT = 90_000 * 10 ** 18;
    uint64 constant CLIFF_DURATION = 30 days;
    uint64 constant DURATION = 90 days;

    function setUp() public {
        owner = makeAddr("owner");
        beneficiary = makeAddr("beneficiary");
        depositor = makeAddr("depositor");

        vm.warp(1_000_000); // pin to a known timestamp

        vm.prank(owner);
        token = new Auric(owner, makeAddr("treasury"));
        vesting = new TokenVesting(address(token), beneficiary, CLIFF_DURATION, DURATION);

        vm.prank(owner);
        token.transfer(depositor, DEPOSIT_AMOUNT);

        vm.prank(depositor);
        token.approve(address(vesting), DEPOSIT_AMOUNT);
    }

    // ── Constructor ────────────────────────────────────────────────────────────

    function test_constructorSetsFields() public view {
        assertEq(address(vesting.token()), address(token));
        assertEq(vesting.beneficiary(), beneficiary);
        assertEq(vesting.start(), 1_000_000);
        assertEq(vesting.cliff(), 1_000_000 + CLIFF_DURATION);
        assertEq(vesting.end(), 1_000_000 + DURATION);
    }

    function test_constructorRevertsOnZeroDuration() public {
        vm.expectRevert(TokenVesting.InvalidDuration.selector);
        new TokenVesting(address(token), beneficiary, 0, 0);
    }

    function test_constructorRevertsIfCliffExceedsDuration() public {
        vm.expectRevert(TokenVesting.InvalidDuration.selector);
        new TokenVesting(address(token), beneficiary, 91 days, 90 days);
    }

    function test_constructorAllowsZeroCliff() public {
        // No cliff: vesting starts immediately at t=0
        TokenVesting v = new TokenVesting(address(token), beneficiary, 0, DURATION);
        assertEq(v.cliff(), v.start());
    }

    function test_constructorAllowsCliffEqualsDuration() public {
        // Cliff == duration: all tokens unlock at the very end
        TokenVesting v = new TokenVesting(address(token), beneficiary, DURATION, DURATION);
        assertEq(v.cliff(), v.end());
    }

    // ── Deposit ────────────────────────────────────────────────────────────────

    function test_depositLocksTokensInContract() public {
        vm.prank(depositor);
        vesting.deposit(DEPOSIT_AMOUNT);

        assertEq(token.balanceOf(address(vesting)), DEPOSIT_AMOUNT);
        assertEq(vesting.totalAmount(), DEPOSIT_AMOUNT);
        assertTrue(vesting.deposited());
        assertEq(token.balanceOf(depositor), 0);
    }

    function test_depositEmitsEvent() public {
        vm.expectEmit(true, false, false, true, address(vesting));
        emit Deposited(depositor, DEPOSIT_AMOUNT);
        vm.prank(depositor);
        vesting.deposit(DEPOSIT_AMOUNT);
    }

    function test_depositRevertsOnZeroAmount() public {
        vm.prank(depositor);
        vm.expectRevert(TokenVesting.ZeroAmount.selector);
        vesting.deposit(0);
    }

    function test_depositRevertsIfAlreadyDeposited() public {
        vm.prank(depositor);
        vesting.deposit(DEPOSIT_AMOUNT);

        // Second deposit by anyone must revert before any transfer
        vm.expectRevert(TokenVesting.AlreadyDeposited.selector);
        vesting.deposit(1);
    }

    // ── Cliff ──────────────────────────────────────────────────────────────────

    function test_vestedAmountIsZeroBeforeCliff() public {
        vm.prank(depositor);
        vesting.deposit(DEPOSIT_AMOUNT);

        assertEq(vesting.vestedAmount(vesting.cliff() - 1), 0);
        assertEq(vesting.vestedAmount(vesting.start()), 0);
    }

    function test_releasableIsZeroBeforeCliff() public {
        vm.prank(depositor);
        vesting.deposit(DEPOSIT_AMOUNT);

        // At deploy time (before cliff) nothing is releasable
        assertEq(vesting.releasable(), 0);
    }

    // ── Early withdrawal revert ────────────────────────────────────────────────

    function test_releaseRevertsImmediatelyAfterDeposit() public {
        vm.prank(depositor);
        vesting.deposit(DEPOSIT_AMOUNT);

        vm.expectRevert(TokenVesting.CliffNotReached.selector);
        vesting.release();
    }

    function test_releaseRevertsAtCliffMinusOne() public {
        vm.prank(depositor);
        vesting.deposit(DEPOSIT_AMOUNT);

        vm.warp(vesting.cliff() - 1);
        vm.expectRevert(TokenVesting.CliffNotReached.selector);
        vesting.release();
    }

    // ── Linear release ─────────────────────────────────────────────────────────

    function test_releaseAtCliff() public {
        vm.prank(depositor);
        vesting.deposit(DEPOSIT_AMOUNT);

        vm.warp(vesting.cliff()); // 30 / 90 days elapsed → 1/3 vested
        vesting.release();

        assertEq(token.balanceOf(beneficiary), DEPOSIT_AMOUNT / 3);
        assertEq(vesting.released(), DEPOSIT_AMOUNT / 3);
        assertEq(token.balanceOf(address(vesting)), DEPOSIT_AMOUNT - DEPOSIT_AMOUNT / 3);
    }

    function test_releaseAtHalfDuration() public {
        vm.prank(depositor);
        vesting.deposit(DEPOSIT_AMOUNT);

        vm.warp(vesting.start() + DURATION / 2); // 45 days → 1/2 vested
        vesting.release();

        assertEq(token.balanceOf(beneficiary), DEPOSIT_AMOUNT / 2);
    }

    function test_releaseAtEnd() public {
        vm.prank(depositor);
        vesting.deposit(DEPOSIT_AMOUNT);

        vm.warp(vesting.end());
        vesting.release();

        assertEq(token.balanceOf(beneficiary), DEPOSIT_AMOUNT);
        assertEq(vesting.released(), DEPOSIT_AMOUNT);
        assertEq(token.balanceOf(address(vesting)), 0);
    }

    function test_releaseAfterEndReleasesAll() public {
        vm.prank(depositor);
        vesting.deposit(DEPOSIT_AMOUNT);

        vm.warp(vesting.end() + 365 days);
        vesting.release();

        assertEq(token.balanceOf(beneficiary), DEPOSIT_AMOUNT);
    }

    function test_releaseGoesToBeneficiary() public {
        vm.prank(depositor);
        vesting.deposit(DEPOSIT_AMOUNT);

        vm.warp(vesting.end());
        // Called by a third party (address(this)), tokens must go to beneficiary
        vesting.release();

        assertEq(token.balanceOf(beneficiary), DEPOSIT_AMOUNT);
    }

    function test_releaseEmitsEvent() public {
        vm.prank(depositor);
        vesting.deposit(DEPOSIT_AMOUNT);

        vm.warp(vesting.end());
        vm.expectEmit(true, false, false, true, address(vesting));
        emit Released(beneficiary, DEPOSIT_AMOUNT);
        vesting.release();
    }

    function test_multipleReleasesAccumulate() public {
        vm.prank(depositor);
        vesting.deposit(DEPOSIT_AMOUNT);

        // First claim at 45 days (half)
        vm.warp(vesting.start() + DURATION / 2);
        vesting.release();
        assertEq(token.balanceOf(beneficiary), DEPOSIT_AMOUNT / 2);
        assertEq(vesting.released(), DEPOSIT_AMOUNT / 2);

        // Second claim at 90 days (end): only the remaining half comes out
        vm.warp(vesting.end());
        vesting.release();
        assertEq(token.balanceOf(beneficiary), DEPOSIT_AMOUNT);
        assertEq(vesting.released(), DEPOSIT_AMOUNT);
    }

    function test_releaseRevertsIfNothingRemaining() public {
        vm.prank(depositor);
        vesting.deposit(DEPOSIT_AMOUNT);

        vm.warp(vesting.end());
        vesting.release();

        vm.expectRevert(TokenVesting.NothingToRelease.selector);
        vesting.release();
    }

    function test_releasableDecreasesAfterRelease() public {
        vm.prank(depositor);
        vesting.deposit(DEPOSIT_AMOUNT);

        vm.warp(vesting.end());
        uint256 before = vesting.releasable();
        assertEq(before, DEPOSIT_AMOUNT);

        vesting.release();
        assertEq(vesting.releasable(), 0);
    }

    // ── Fuzz ──────────────────────────────────────────────────────────────────

    function testFuzz_vestedAmountNeverExceedsTotalAndMonotone(uint64 t1, uint64 t2) public {
        vm.prank(depositor);
        vesting.deposit(DEPOSIT_AMOUNT);

        uint256 v1 = vesting.vestedAmount(t1);
        uint256 v2 = vesting.vestedAmount(t2);

        // Always bounded
        assertLe(v1, DEPOSIT_AMOUNT);
        assertLe(v2, DEPOSIT_AMOUNT);

        // Monotone: later timestamp → at least as much vested
        if (t2 >= t1) assertGe(v2, v1);

        // Zero before cliff
        if (t1 < vesting.cliff()) assertEq(v1, 0);

        // Full amount at or after end
        if (t1 >= vesting.end()) assertEq(v1, DEPOSIT_AMOUNT);
    }
}
