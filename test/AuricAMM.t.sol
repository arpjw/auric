// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Auric} from "../src/Auric.sol";
import {AuricAMM} from "../src/AuricAMM.sol";

contract AuricAMMTest is Test {
    // Re-declare events for vm.expectEmit.
    event LiquidityAdded(address indexed provider, uint256 tokenAmount, uint256 ethAmount, uint256 sharesOut);
    event LiquidityRemoved(address indexed provider, uint256 tokenAmount, uint256 ethAmount, uint256 sharesBurned);
    event Swap(address indexed user, uint256 tokenIn, uint256 ethIn, uint256 tokenOut, uint256 ethOut);

    Auric public token;
    AuricAMM public amm;

    address public owner;
    address public treasury;
    address public alice; // initial LP
    address public bob;   // second LP / swapper

    // Initial pool: 10,000 AUR + 100 ETH → price 100 AUR/ETH.
    // INIT_SHARES = sqrt(10_000e18 * 100e18) = sqrt(10^42) = 10^21 = 1_000e18.
    uint256 constant INIT_TOKEN = 10_000e18;
    uint256 constant INIT_ETH   = 100 ether;
    uint256 constant INIT_SHARES = 1_000e18;

    uint256 constant ALICE_TOKENS = 1_000_000e18;
    uint256 constant ALICE_ETH    = 1_000 ether;
    uint256 constant BOB_TOKENS   = 100_000e18;
    uint256 constant BOB_ETH      = 100 ether;

    function setUp() public {
        owner    = makeAddr("owner");
        treasury = makeAddr("treasury");
        alice    = makeAddr("alice");
        bob      = makeAddr("bob");

        vm.prank(owner);
        token = new Auric(owner, treasury);

        amm = new AuricAMM(address(token));

        vm.startPrank(owner);
        token.mint(alice, ALICE_TOKENS);
        token.mint(bob, BOB_TOKENS);
        vm.stopPrank();

        vm.deal(alice, ALICE_ETH);
        vm.deal(bob, BOB_ETH);
    }

    // Seeds the pool with alice's initial deposit.
    function _addInitialLiquidity() internal {
        vm.startPrank(alice);
        token.approve(address(amm), INIT_TOKEN);
        amm.addLiquidity{value: INIT_ETH}(INIT_TOKEN);
        vm.stopPrank();
    }

    // Mirrors the contract's fee formula so tests don't duplicate magic numbers.
    function _expectedOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        internal
        pure
        returns (uint256)
    {
        uint256 amountInWithFee = amountIn * 997;
        return (reserveOut * amountInWithFee) / (reserveIn * 1000 + amountInWithFee);
    }

    // ── Constructor ────────────────────────────────────────────────────────────

    function test_constructorSetsToken() public view {
        assertEq(address(amm.token()), address(token));
    }

    function test_feeConstants() public view {
        assertEq(amm.FEE_NUMERATOR(), 997);
        assertEq(amm.FEE_DENOMINATOR(), 1000);
    }

    // ── addLiquidity — initial deposit ─────────────────────────────────────────

    function test_initialLiquiditySeedsReserves() public {
        _addInitialLiquidity();

        assertEq(amm.reserveToken(), INIT_TOKEN);
        assertEq(amm.reserveEth(), INIT_ETH);
        assertEq(amm.totalShares(), INIT_SHARES);
        assertEq(amm.shares(alice), INIT_SHARES);
        assertEq(token.balanceOf(address(amm)), INIT_TOKEN);
    }

    function test_initialSharesAreGeometricMean() public {
        // sqrt(10_000e18 * 100e18) = sqrt(10^42) = 10^21 = 1_000e18
        _addInitialLiquidity();
        assertEq(amm.shares(alice), INIT_SHARES);
    }

    function test_addLiquidityEmitsEvent() public {
        vm.startPrank(alice);
        token.approve(address(amm), INIT_TOKEN);
        vm.expectEmit(true, false, false, true, address(amm));
        emit LiquidityAdded(alice, INIT_TOKEN, INIT_ETH, INIT_SHARES);
        amm.addLiquidity{value: INIT_ETH}(INIT_TOKEN);
        vm.stopPrank();
    }

    function test_addLiquidityRevertsOnZeroEth() public {
        vm.prank(alice);
        token.approve(address(amm), INIT_TOKEN);
        vm.prank(alice);
        vm.expectRevert(AuricAMM.ZeroAmount.selector);
        amm.addLiquidity{value: 0}(INIT_TOKEN);
    }

    function test_addLiquidityRevertsOnZeroToken() public {
        vm.prank(alice);
        vm.expectRevert(AuricAMM.ZeroAmount.selector);
        amm.addLiquidity{value: 1 ether}(0);
    }

    // ── addLiquidity — proportional deposit ───────────────────────────────────

    function test_proportionalDepositMintsCorrectShares() public {
        _addInitialLiquidity();

        // Bob adds 10 ETH.
        // Required AUR = 10/100 * 10_000 = 1_000. New shares = 10/100 * 1_000 = 100.
        uint256 bobEth = 10 ether;
        uint256 requiredToken = bobEth * INIT_TOKEN / INIT_ETH; // 1_000e18

        vm.startPrank(bob);
        token.approve(address(amm), requiredToken);
        amm.addLiquidity{value: bobEth}(requiredToken);
        vm.stopPrank();

        assertEq(amm.shares(bob), 100e18);
        assertEq(amm.totalShares(), INIT_SHARES + 100e18);
        assertEq(amm.reserveToken(), INIT_TOKEN + requiredToken);
        assertEq(amm.reserveEth(), INIT_ETH + bobEth);
    }

    function test_proportionalDepositPullsOnlyRequiredTokens() public {
        _addInitialLiquidity();

        // Bob approves 5_000e18 but only 1_000e18 should be pulled.
        uint256 requiredToken = 1_000e18;
        uint256 tokensBefore = token.balanceOf(bob);

        vm.startPrank(bob);
        token.approve(address(amm), 5_000e18);
        amm.addLiquidity{value: 10 ether}(5_000e18);
        vm.stopPrank();

        assertEq(token.balanceOf(bob), tokensBefore - requiredToken);
    }

    function test_proportionalDepositRevertsIfSlippage() public {
        _addInitialLiquidity();

        // 10 ETH requires 1_000 AUR; passing 900 should revert.
        vm.startPrank(bob);
        token.approve(address(amm), 900e18);
        vm.expectRevert(AuricAMM.SlippageExceeded.selector);
        amm.addLiquidity{value: 10 ether}(900e18);
        vm.stopPrank();
    }

    // ── removeLiquidity ────────────────────────────────────────────────────────

    function test_removeLiquidityAllReturnsFullReserves() public {
        _addInitialLiquidity();

        uint256 aliceTokenBefore = token.balanceOf(alice);
        uint256 aliceEthBefore   = alice.balance;

        vm.prank(alice);
        (uint256 tokenOut, uint256 ethOut) = amm.removeLiquidity(INIT_SHARES);

        assertEq(tokenOut, INIT_TOKEN);
        assertEq(ethOut, INIT_ETH);
        assertEq(token.balanceOf(alice), aliceTokenBefore + INIT_TOKEN);
        assertEq(alice.balance, aliceEthBefore + INIT_ETH);
        assertEq(amm.totalShares(), 0);
        assertEq(amm.reserveToken(), 0);
        assertEq(amm.reserveEth(), 0);
    }

    function test_removePartialLiquidityIsProportional() public {
        _addInitialLiquidity();

        vm.prank(alice);
        (uint256 tokenOut, uint256 ethOut) = amm.removeLiquidity(INIT_SHARES / 2);

        assertEq(tokenOut, INIT_TOKEN / 2);
        assertEq(ethOut, INIT_ETH / 2);
        assertEq(amm.shares(alice), INIT_SHARES / 2);
        assertEq(amm.totalShares(), INIT_SHARES / 2);
    }

    function test_twoLPsReceiveProportionalAmounts() public {
        _addInitialLiquidity();

        // Bob adds 10 ETH / 1_000 AUR → 100e18 shares (10% of pool).
        vm.startPrank(bob);
        token.approve(address(amm), 1_000e18);
        amm.addLiquidity{value: 10 ether}(1_000e18);
        vm.stopPrank();

        // Alice owns 1000/(1000+100) = 90.9% of pool.
        vm.prank(alice);
        (uint256 aliceToken, uint256 aliceEth) = amm.removeLiquidity(INIT_SHARES);
        // No swaps occurred, so she gets back exactly what she deposited.
        assertEq(aliceToken, INIT_TOKEN);
        assertEq(aliceEth, INIT_ETH);

        // Bob's 100e18 shares now represent 100% of remaining pool (1_000 AUR, 10 ETH).
        vm.prank(bob);
        (uint256 bobToken, uint256 bobEth) = amm.removeLiquidity(100e18);
        assertEq(bobToken, 1_000e18);
        assertEq(bobEth, 10 ether);
    }

    function test_removeLiquidityEmitsEvent() public {
        _addInitialLiquidity();

        vm.expectEmit(true, false, false, true, address(amm));
        emit LiquidityRemoved(alice, INIT_TOKEN, INIT_ETH, INIT_SHARES);
        vm.prank(alice);
        amm.removeLiquidity(INIT_SHARES);
    }

    function test_removeLiquidityRevertsOnZeroShares() public {
        _addInitialLiquidity();

        vm.prank(alice);
        vm.expectRevert(AuricAMM.ZeroAmount.selector);
        amm.removeLiquidity(0);
    }

    function test_removeLiquidityRevertsIfInsufficientShares() public {
        _addInitialLiquidity();

        vm.prank(alice);
        vm.expectRevert(AuricAMM.InsufficientShares.selector);
        amm.removeLiquidity(INIT_SHARES + 1);
    }

    function test_removeLiquidityRevertsWithNoPosition() public {
        _addInitialLiquidity();

        vm.prank(bob);
        vm.expectRevert(AuricAMM.InsufficientShares.selector);
        amm.removeLiquidity(1);
    }

    // ── swapETHForTokens ───────────────────────────────────────────────────────

    function test_swapETHForTokensOutputAndReserves() public {
        _addInitialLiquidity();

        uint256 ethIn = 1 ether;
        uint256 expected = _expectedOut(ethIn, INIT_ETH, INIT_TOKEN);

        vm.deal(bob, ethIn);
        vm.prank(bob);
        uint256 tokenOut = amm.swapETHForTokens{value: ethIn}(0);

        assertEq(tokenOut, expected);
        assertEq(token.balanceOf(bob), BOB_TOKENS + expected);
        assertEq(amm.reserveEth(), INIT_ETH + ethIn);
        assertEq(amm.reserveToken(), INIT_TOKEN - expected);
    }

    function test_swapETHForTokensEmitsEvent() public {
        _addInitialLiquidity();

        uint256 ethIn = 1 ether;
        uint256 expected = _expectedOut(ethIn, INIT_ETH, INIT_TOKEN);

        vm.deal(bob, ethIn);
        vm.expectEmit(true, false, false, true, address(amm));
        emit Swap(bob, 0, ethIn, expected, 0);
        vm.prank(bob);
        amm.swapETHForTokens{value: ethIn}(0);
    }

    function test_swapETHForTokensRevertsOnZeroEth() public {
        _addInitialLiquidity();

        vm.prank(bob);
        vm.expectRevert(AuricAMM.ZeroAmount.selector);
        amm.swapETHForTokens{value: 0}(0);
    }

    function test_swapETHForTokensRevertsOnSlippage() public {
        _addInitialLiquidity();

        vm.deal(bob, 1 ether);
        vm.prank(bob);
        vm.expectRevert(AuricAMM.SlippageExceeded.selector);
        amm.swapETHForTokens{value: 1 ether}(type(uint256).max);
    }

    function test_swapETHForTokensRevertsWithEmptyPool() public {
        vm.deal(bob, 1 ether);
        vm.prank(bob);
        vm.expectRevert(AuricAMM.InsufficientLiquidity.selector);
        amm.swapETHForTokens{value: 1 ether}(0);
    }

    // ── swapTokensForETH ───────────────────────────────────────────────────────

    function test_swapTokensForETHOutputAndReserves() public {
        _addInitialLiquidity();

        uint256 tokenIn = 1_000e18;
        uint256 expected = _expectedOut(tokenIn, INIT_TOKEN, INIT_ETH);

        vm.startPrank(bob);
        token.approve(address(amm), tokenIn);
        uint256 ethOut = amm.swapTokensForETH(tokenIn, 0);
        vm.stopPrank();

        assertEq(ethOut, expected);
        assertEq(bob.balance, BOB_ETH + expected);
        assertEq(amm.reserveToken(), INIT_TOKEN + tokenIn);
        assertEq(amm.reserveEth(), INIT_ETH - expected);
    }

    function test_swapTokensForETHEmitsEvent() public {
        _addInitialLiquidity();

        uint256 tokenIn = 1_000e18;
        uint256 expected = _expectedOut(tokenIn, INIT_TOKEN, INIT_ETH);

        vm.startPrank(bob);
        token.approve(address(amm), tokenIn);
        vm.expectEmit(true, false, false, true, address(amm));
        emit Swap(bob, tokenIn, 0, 0, expected);
        amm.swapTokensForETH(tokenIn, 0);
        vm.stopPrank();
    }

    function test_swapTokensForETHRevertsOnZeroToken() public {
        _addInitialLiquidity();

        vm.prank(bob);
        vm.expectRevert(AuricAMM.ZeroAmount.selector);
        amm.swapTokensForETH(0, 0);
    }

    function test_swapTokensForETHRevertsOnSlippage() public {
        _addInitialLiquidity();

        vm.startPrank(bob);
        token.approve(address(amm), 1_000e18);
        vm.expectRevert(AuricAMM.SlippageExceeded.selector);
        amm.swapTokensForETH(1_000e18, type(uint256).max);
        vm.stopPrank();
    }

    function test_swapTokensForETHRevertsWithEmptyPool() public {
        vm.startPrank(bob);
        token.approve(address(amm), 1_000e18);
        vm.expectRevert(AuricAMM.InsufficientLiquidity.selector);
        amm.swapTokensForETH(1_000e18, 0);
        vm.stopPrank();
    }

    // ── x*y=k invariant ────────────────────────────────────────────────────────

    function test_swapETHForTokensStrictlyIncreasesK() public {
        _addInitialLiquidity();

        uint256 kBefore = amm.reserveToken() * amm.reserveEth();

        vm.deal(bob, 5 ether);
        vm.prank(bob);
        amm.swapETHForTokens{value: 5 ether}(0);

        // k should be strictly greater because the fee stays in the pool.
        assertGt(amm.reserveToken() * amm.reserveEth(), kBefore);
    }

    function test_swapTokensForETHStrictlyIncreasesK() public {
        _addInitialLiquidity();

        uint256 kBefore = amm.reserveToken() * amm.reserveEth();

        vm.startPrank(bob);
        token.approve(address(amm), 500e18);
        amm.swapTokensForETH(500e18, 0);
        vm.stopPrank();

        assertGt(amm.reserveToken() * amm.reserveEth(), kBefore);
    }

    // ── LP fee accrual ─────────────────────────────────────────────────────────

    function test_lpCapturesSwapFeeAsETH() public {
        _addInitialLiquidity();

        // Bob swaps 1 ETH into the pool; ETH reserve becomes 101 ETH.
        vm.deal(bob, 1 ether);
        vm.prank(bob);
        amm.swapETHForTokens{value: 1 ether}(0);

        // Alice is the only LP; removing all shares returns the full reserves.
        // ETH out = 101 ETH (her 100 + bob's 1), so she nets +1 ETH from the fee.
        vm.prank(alice);
        (, uint256 ethOut) = amm.removeLiquidity(INIT_SHARES);

        assertEq(ethOut, INIT_ETH + 1 ether);
    }

    function test_roundTripSwapLosesToFees() public {
        _addInitialLiquidity();

        // Bob swaps 10 ETH → tokens, then immediately swaps all tokens back → ETH.
        // Two 0.3% fees means he recovers ~99.4% of his input.
        uint256 ethIn = 10 ether;

        vm.deal(bob, ethIn);
        vm.prank(bob);
        uint256 tokensReceived = amm.swapETHForTokens{value: ethIn}(0);

        vm.startPrank(bob);
        token.approve(address(amm), tokensReceived);
        uint256 ethBack = amm.swapTokensForETH(tokensReceived, 0);
        vm.stopPrank();

        assertLt(ethBack, ethIn);   // round trip always costs fees
        assertGt(ethBack, 0);        // still gets meaningful ETH back
    }

    // ── getAmountOut view ──────────────────────────────────────────────────────

    function test_getAmountOutKnownValue() public view {
        // Manual: (10_000 * 1_000 * 997) / (10_000*1_000 + 1_000*997)
        //        = 9_970_000_000 / 10_997_000 = 906 (floor)
        assertEq(amm.getAmountOut(1_000, 10_000, 10_000), 906);
    }

    function test_getAmountOutLargerInputGivesMoreOutput() public view {
        uint256 small = amm.getAmountOut(100e18, INIT_TOKEN, INIT_ETH);
        uint256 large = amm.getAmountOut(200e18, INIT_TOKEN, INIT_ETH);
        assertGt(large, small);
    }

    function test_getAmountOutRevertsOnZeroInput() public {
        vm.expectRevert(AuricAMM.ZeroAmount.selector);
        amm.getAmountOut(0, INIT_TOKEN, INIT_ETH);
    }

    function test_getAmountOutRevertsOnZeroReserve() public {
        vm.expectRevert(AuricAMM.InsufficientLiquidity.selector);
        amm.getAmountOut(1_000e18, 0, INIT_ETH);
    }

    // ── Fuzz ───────────────────────────────────────────────────────────────────

    function testFuzz_swapETHNeverDecreasesK(uint256 ethIn) public {
        _addInitialLiquidity();
        // Cap at 10% of pool to keep reserves sane and avoid uint256 overflow in k.
        ethIn = bound(ethIn, 1, INIT_ETH / 10);

        uint256 kBefore = amm.reserveToken() * amm.reserveEth();

        vm.deal(bob, ethIn);
        vm.prank(bob);
        amm.swapETHForTokens{value: ethIn}(0);

        assertGe(amm.reserveToken() * amm.reserveEth(), kBefore);
    }

    function testFuzz_swapTokensNeverDecreasesK(uint256 tokenIn) public {
        _addInitialLiquidity();
        tokenIn = bound(tokenIn, 1, INIT_TOKEN / 10);

        vm.prank(owner);
        token.mint(bob, tokenIn);

        uint256 kBefore = amm.reserveToken() * amm.reserveEth();

        vm.startPrank(bob);
        token.approve(address(amm), tokenIn);
        amm.swapTokensForETH(tokenIn, 0);
        vm.stopPrank();

        assertGe(amm.reserveToken() * amm.reserveEth(), kBefore);
    }
}
