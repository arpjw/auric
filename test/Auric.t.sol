// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Auric} from "../src/Auric.sol";

contract AuricTest is Test {
    Auric public token;
    address public owner;
    address public alice;
    address public bob;

    uint256 constant INITIAL_SUPPLY = 1_000_000 * 10 ** 18;

    function setUp() public {
        owner = makeAddr("owner");
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        vm.prank(owner);
        token = new Auric(owner);
    }

    // Deployment

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

    // Transfer

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

    // Mint access control

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

    // Burn

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
}
