// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// Toy constant-product (x*y=k) AMM for an ERC-20 / ETH pair.
///
/// Design notes (intentional simplifications for learning):
///  - LP shares tracked internally (no separate LP token).
///  - 0.3% swap fee stays in the pool, accruing to LPs.
///  - No oracle, no flash loan, no governance, no admin controls.
///  - Not safe with fee-on-transfer tokens (Auric tax must be 0 when using this pool).
///
/// NOT AUDITED — do not deploy to mainnet.
contract AuricAMM {
    using SafeERC20 for IERC20;

    error ZeroAmount();
    error ZeroShares();
    error InsufficientShares();
    error InsufficientLiquidity();
    error SlippageExceeded();
    error ETHTransferFailed();

    event LiquidityAdded(address indexed provider, uint256 tokenAmount, uint256 ethAmount, uint256 sharesOut);
    event LiquidityRemoved(address indexed provider, uint256 tokenAmount, uint256 ethAmount, uint256 sharesBurned);
    event Swap(address indexed user, uint256 tokenIn, uint256 ethIn, uint256 tokenOut, uint256 ethOut);

    /// 0.3% swap fee: amountIn * 997 / 1000 counts toward the output computation.
    /// The 0.3% remainder stays in the pool as fee income for LPs.
    uint256 public constant FEE_NUMERATOR = 997;
    uint256 public constant FEE_DENOMINATOR = 1000;

    IERC20 public immutable token;

    uint256 public reserveToken;
    uint256 public reserveEth;
    uint256 public totalShares;
    mapping(address => uint256) public shares;

    constructor(address _token) {
        token = IERC20(_token);
    }

    // ── Liquidity ─────────────────────────────────────────────────────────────

    /// Adds liquidity to the pool and mints LP shares to the caller.
    ///
    /// Initial deposit: both tokenAmount and msg.value seed the pool.
    ///   LP shares = sqrt(tokenAmount * ethAmount).
    ///
    /// Subsequent deposits: msg.value (ETH) determines the scale; the required
    ///   token amount is derived from the current ratio. `tokenAmount` is a slippage
    ///   cap — reverts with SlippageExceeded if the pool demands more tokens than that.
    ///   LP shares = ethAmount * totalShares / reserveEth.
    ///
    /// Caller must approve this contract for at least the required token amount.
    function addLiquidity(uint256 tokenAmount) external payable returns (uint256 sharesOut) {
        uint256 ethAmount = msg.value;
        if (tokenAmount == 0 || ethAmount == 0) revert ZeroAmount();

        uint256 _totalShares = totalShares;

        if (_totalShares == 0) {
            // Geometric mean prevents liquidity-inflation attacks on the initial price.
            sharesOut = Math.sqrt(tokenAmount * ethAmount);
        } else {
            // Scale the token input to the current ETH/token ratio.
            uint256 requiredToken = (ethAmount * reserveToken) / reserveEth;
            if (requiredToken > tokenAmount) revert SlippageExceeded();
            tokenAmount = requiredToken;
            sharesOut = (ethAmount * _totalShares) / reserveEth;
        }

        if (sharesOut == 0) revert ZeroShares();

        totalShares = _totalShares + sharesOut;
        shares[msg.sender] += sharesOut;
        reserveToken += tokenAmount;
        reserveEth += ethAmount;

        token.safeTransferFrom(msg.sender, address(this), tokenAmount);
        emit LiquidityAdded(msg.sender, tokenAmount, ethAmount, sharesOut);
    }

    /// Burns `sharesToBurn` LP shares and returns the proportional token and ETH to caller.
    function removeLiquidity(uint256 sharesToBurn) external returns (uint256 tokenOut, uint256 ethOut) {
        if (sharesToBurn == 0) revert ZeroAmount();
        if (shares[msg.sender] < sharesToBurn) revert InsufficientShares();

        uint256 _totalShares = totalShares;
        tokenOut = (sharesToBurn * reserveToken) / _totalShares;
        ethOut = (sharesToBurn * reserveEth) / _totalShares;

        // State changes before external calls (checks-effects-interactions).
        shares[msg.sender] -= sharesToBurn;
        totalShares -= sharesToBurn;
        reserveToken -= tokenOut;
        reserveEth -= ethOut;

        token.safeTransfer(msg.sender, tokenOut);
        (bool ok,) = payable(msg.sender).call{value: ethOut}("");
        if (!ok) revert ETHTransferFailed();

        emit LiquidityRemoved(msg.sender, tokenOut, ethOut, sharesToBurn);
    }

    // ── Swaps ─────────────────────────────────────────────────────────────────

    /// Swaps ETH → token. Reverts if output falls below `minTokenOut`.
    function swapETHForTokens(uint256 minTokenOut) external payable returns (uint256 tokenOut) {
        uint256 ethIn = msg.value;
        if (ethIn == 0) revert ZeroAmount();
        if (reserveToken == 0 || reserveEth == 0) revert InsufficientLiquidity();

        tokenOut = _getAmountOut(ethIn, reserveEth, reserveToken);
        if (tokenOut < minTokenOut) revert SlippageExceeded();

        // Effects before interactions.
        reserveEth += ethIn;
        reserveToken -= tokenOut;

        token.safeTransfer(msg.sender, tokenOut);
        emit Swap(msg.sender, 0, ethIn, tokenOut, 0);
    }

    /// Swaps token → ETH. Reverts if output falls below `minEthOut`.
    function swapTokensForETH(uint256 tokenIn, uint256 minEthOut) external returns (uint256 ethOut) {
        if (tokenIn == 0) revert ZeroAmount();
        if (reserveToken == 0 || reserveEth == 0) revert InsufficientLiquidity();

        ethOut = _getAmountOut(tokenIn, reserveToken, reserveEth);
        if (ethOut < minEthOut) revert SlippageExceeded();

        // Effects before interactions.
        reserveToken += tokenIn;
        reserveEth -= ethOut;

        token.safeTransferFrom(msg.sender, address(this), tokenIn);
        (bool ok,) = payable(msg.sender).call{value: ethOut}("");
        if (!ok) revert ETHTransferFailed();

        emit Swap(msg.sender, tokenIn, 0, 0, ethOut);
    }

    // ── View ──────────────────────────────────────────────────────────────────

    /// Returns the output amount for amountIn, given reserves, after the 0.3% fee.
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        external
        pure
        returns (uint256)
    {
        if (amountIn == 0) revert ZeroAmount();
        if (reserveIn == 0 || reserveOut == 0) revert InsufficientLiquidity();
        return _getAmountOut(amountIn, reserveIn, reserveOut);
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    /// Constant-product output formula with 0.3% fee.
    ///
    /// Without fee: amountOut = reserveOut * amountIn / (reserveIn + amountIn)
    /// With fee:    amountOut = reserveOut * (amountIn * 997) / (reserveIn * 1000 + amountIn * 997)
    ///
    /// The fee stays inside the pool (reserveIn grows by the full amountIn, but only
    /// 99.7% of amountIn is counted in the numerator), so x*y strictly increases.
    function _getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        internal
        pure
        returns (uint256)
    {
        uint256 amountInWithFee = amountIn * FEE_NUMERATOR;
        return (reserveOut * amountInWithFee) / (reserveIn * FEE_DENOMINATOR + amountInWithFee);
    }
}
