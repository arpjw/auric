// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Auric} from "../src/Auric.sol";

contract AuricTest is Test {
    // Re-declare so vm.expectEmit can match it.
    event TaxUpdated(uint16 oldBps, uint16 newBps);

    Auric public token;
    address public owner;
    address public treasury;
    address public alice;
    address public bob;

    uint256 constant INITIAL_SUPPLY = 1_000_000 * 10 ** 18;

    function setUp() public {
        owner = makeAddr("owner");
        treasury = makeAddr("treasury");
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        vm.prank(owner);
        token = new Auric(owner, treasury);
    }

    // ── Deployment ─────────────────────────────────────────────────────────────

    function test_name() public view {
        assertEq(token.name(), "Auric");
    }

    function test_symbol() public view {
        assertEq(token.symbol(), "AUR");
    }

    function test_decimals() public view {
        assertEq(token.decimals(), 18);
    }

    function test_initialSupplyMintedToDeployer() public view {
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY);
    }

    function test_ownerIsDeployer() public view {
        assertEq(token.owner(), owner);
    }

    function test_treasurySetInConstructor() public view {
        assertEq(token.treasury(), treasury);
    }

    // ── Transfer (tax = 0, so recipient gets full amount) ──────────────────────

    function test_transfer() public {
        uint256 amount = 1000 * 10 ** 18;
        vm.prank(owner);
        assertTrue(token.transfer(alice, amount));
        assertEq(token.balanceOf(alice), amount);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - amount);
    }

    function test_transferFrom() public {
        uint256 amount = 500 * 10 ** 18;
        vm.prank(owner);
        token.approve(alice, amount);
        vm.prank(alice);
        assertTrue(token.transferFrom(owner, bob, amount));
        assertEq(token.balanceOf(bob), amount);
        assertEq(token.allowance(owner, alice), 0);
    }

    function test_transferFailsInsufficientBalance() public {
        vm.prank(alice);
        vm.expectRevert();
        token.transfer(bob, 1);
    }

    // ── Mint access control ────────────────────────────────────────────────────

    function test_ownerCanMint() public {
        uint256 amount = 500 * 10 ** 18;
        vm.prank(owner);
        token.mint(alice, amount);
        assertEq(token.balanceOf(alice), amount);
        assertEq(token.totalSupply(), INITIAL_SUPPLY + amount);
    }

    function test_nonOwnerCannotMint() public {
        vm.prank(alice);
        vm.expectRevert();
        token.mint(alice, 1);
    }

    // ── Burn ───────────────────────────────────────────────────────────────────

    function test_holderCanBurnOwnTokens() public {
        uint256 amount = 100 * 10 ** 18;
        vm.prank(owner);
        assertTrue(token.transfer(alice, amount));
        vm.prank(alice);
        token.burn(amount);
        assertEq(token.balanceOf(alice), 0);
        assertEq(token.totalSupply(), INITIAL_SUPPLY - amount);
    }

    function test_burnReducesTotalSupply() public {
        uint256 burnAmount = 250_000 * 10 ** 18;
        vm.prank(owner);
        token.burn(burnAmount);
        assertEq(token.totalSupply(), INITIAL_SUPPLY - burnAmount);
    }

    function test_burnFailsInsufficientBalance() public {
        vm.prank(alice);
        vm.expectRevert();
        token.burn(1);
    }

    function test_ownerCanBurnOwnTokens() public {
        uint256 burnAmount = 1000 * 10 ** 18;
        vm.prank(owner);
        token.burn(burnAmount);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - burnAmount);
    }

    // ── Tax configuration ──────────────────────────────────────────────────────

    function test_taxDefaultsToZero() public view {
        assertEq(token.taxBps(), 0);
    }

    function test_maxTaxBpsConstant() public view {
        assertEq(token.MAX_TAX_BPS(), 1_000);
    }

    function test_ownerCanSetTax() public {
        vm.prank(owner);
        token.setTaxBps(500);
        assertEq(token.taxBps(), 500);
    }

    function test_ownerCanSetTaxToMax() public {
        vm.prank(owner);
        token.setTaxBps(1_000); // exactly 10%
        assertEq(token.taxBps(), 1_000);
    }

    function test_ownerCanDisableTax() public {
        vm.prank(owner);
        token.setTaxBps(500);
        vm.prank(owner);
        token.setTaxBps(0);
        assertEq(token.taxBps(), 0);
    }

    function test_nonOwnerCannotSetTax() public {
        vm.prank(alice);
        vm.expectRevert();
        token.setTaxBps(100);
    }

    function test_setTaxRevertsAboveMax() public {
        vm.prank(owner);
        vm.expectRevert(Auric.TaxTooHigh.selector);
        token.setTaxBps(1_001);
    }

    function test_setTaxEmitsEvent() public {
        vm.prank(owner);
        token.setTaxBps(200); // set to 200 so we can verify oldBps in the event

        vm.prank(owner);
        vm.expectEmit(false, false, false, true, address(token));
        emit TaxUpdated(200, 500);
        token.setTaxBps(500);
    }

    // ── Tax collection on transfers ────────────────────────────────────────────

    function test_taxDeductedFromTransfer() public {
        vm.prank(owner);
        token.setTaxBps(500); // 5%

        uint256 amount = 10_000 * 10 ** 18;
        uint256 tax = amount * 500 / 10_000; // 500e18

        vm.prank(owner);
        token.transfer(alice, amount);

        assertEq(token.balanceOf(alice), amount - tax);
        assertEq(token.balanceOf(treasury), tax);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - amount);
    }

    function test_taxDeductedFromTransferFrom() public {
        vm.prank(owner);
        token.setTaxBps(500); // 5%

        uint256 amount = 10_000 * 10 ** 18;
        uint256 tax = amount * 500 / 10_000;

        vm.prank(owner);
        token.approve(alice, amount);

        vm.prank(alice);
        assertTrue(token.transferFrom(owner, bob, amount));

        assertEq(token.balanceOf(bob), amount - tax);
        assertEq(token.balanceOf(treasury), tax);
        // Full `amount` is spent from the allowance (not net-of-tax)
        assertEq(token.allowance(owner, alice), 0);
    }

    function test_treasuryBalanceAccumulates() public {
        vm.prank(owner);
        token.setTaxBps(100); // 1%

        uint256 amount = 10_000 * 10 ** 18;
        uint256 taxPerTransfer = amount / 100;

        vm.prank(owner);
        token.transfer(alice, amount);
        vm.prank(owner);
        token.transfer(bob, amount);

        assertEq(token.balanceOf(treasury), 2 * taxPerTransfer);
    }

    function test_noTaxOnMint() public {
        vm.prank(owner);
        token.setTaxBps(500);

        uint256 mintAmount = 1_000 * 10 ** 18;
        vm.prank(owner);
        token.mint(alice, mintAmount);

        assertEq(token.balanceOf(alice), mintAmount);   // full amount, no deduction
        assertEq(token.balanceOf(treasury), 0);          // treasury untouched
    }

    function test_noTaxOnBurn() public {
        vm.prank(owner);
        token.setTaxBps(500);

        // Use mint so no tax is incurred funding alice's balance
        uint256 amount = 1_000 * 10 ** 18;
        vm.prank(owner);
        token.mint(alice, amount);

        vm.prank(alice);
        token.burn(amount);

        assertEq(token.balanceOf(alice), 0);
        assertEq(token.balanceOf(treasury), 0); // no tax on burn
        assertEq(token.totalSupply(), INITIAL_SUPPLY); // back to initial
    }

    function test_noTaxWhenTaxIsZero() public {
        // tax = 0 (default): transfer should be lossless
        uint256 amount = 1_000 * 10 ** 18;
        vm.prank(owner);
        token.transfer(alice, amount);

        assertEq(token.balanceOf(alice), amount);
        assertEq(token.balanceOf(treasury), 0);
    }

    function test_taxRateChangeAffectsSubsequentTransfersOnly() public {
        uint256 amount = 10_000 * 10 ** 18;

        // First transfer at 0% tax
        vm.prank(owner);
        token.transfer(alice, amount);
        assertEq(token.balanceOf(treasury), 0);

        // Enable 10% tax
        vm.prank(owner);
        token.setTaxBps(1_000);

        // Second transfer, tax now applies
        uint256 tax = amount * 1_000 / 10_000; // 10% = 1_000e18
        vm.prank(owner);
        token.transfer(bob, amount);
        assertEq(token.balanceOf(treasury), tax);
    }

    // ── Fuzz ───────────────────────────────────────────────────────────────────

    function testFuzz_taxNeverExceedsTransferAmount(uint16 bps, uint256 amount) public {
        bps = uint16(bound(bps, 0, 1_000));
        amount = bound(amount, 0, token.balanceOf(owner));

        vm.prank(owner);
        token.setTaxBps(bps);

        uint256 treasuryBefore = token.balanceOf(treasury);
        vm.prank(owner);
        token.transfer(alice, amount);

        uint256 taxCollected = token.balanceOf(treasury) - treasuryBefore;
        uint256 aliceReceived = token.balanceOf(alice);

        // Tax + received == amount
        assertEq(taxCollected + aliceReceived, amount);
        // Tax never exceeds 10%
        assertLe(taxCollected, amount * 1_000 / 10_000 + 1); // +1 for rounding
    }
}
