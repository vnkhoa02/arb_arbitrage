// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';

import 'hardhat/console.sol';
import {FlashLoanProvider} from './FlashLoanProvider.sol';

contract Arbitrage is FlashLoanProvider {
    address public owner;
    address public constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    uint24 public poolFeeLow;
    uint256 public poolFeeLowPrice;
    uint24 public poolFeeHigh;
    uint256 public poolFeeHighPrice;

    // — Uniswap V3 Router (mainnet)
    ISwapRouter public constant swapRouter =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    modifier onlyOwner() {
        require(msg.sender == owner, 'Not owner');
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Starts arbitrage by borrowing WETH via flash loan,
     *         then swaps through two Uniswap V3 pools.
     * @param _poolFeeLow The fee tier for the first swap (e.g., 3000)
     * @param _poolFeeHigh The fee tier for the second swap (e.g., 10000)
     * @param borrowAmount Amount of WETH to borrow
     */
    function simpleArbitrage(
        address tokenIn,
        uint24 _poolFeeLow,
        uint256 _poolFeeLowPrice,
        uint24 _poolFeeHigh,
        uint256 _poolFeeHighPrice,
        uint256 borrowAmount
    ) external onlyOwner {
        poolFeeLow = _poolFeeLow;
        poolFeeLowPrice = _poolFeeLowPrice;
        poolFeeHigh = _poolFeeHigh;
        poolFeeHighPrice = _poolFeeHighPrice;

        flashLoan(tokenIn, borrowAmount);
    }

    function flashLoan(address tokenIn, uint256 amount) internal {
        bytes memory userData = abi.encode(
            tokenIn,
            poolFeeLow,
            poolFeeLowPrice,
            poolFeeHigh,
            poolFeeHighPrice
        );
        address[] memory tokens = new address[](1);
        tokens[0] = tokenIn;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        customFlashLoan(tokens, amounts, userData);
    }

    /**
     * @dev Implements the swap logic on receiving a flash loan.
     */
    function _executeOperation(
        address token,
        uint256 amount,
        uint256 fee,
        bytes memory /* userData */
    ) internal override {
        uint256 amountOut;
        if (poolFeeLowPrice < poolFeeHighPrice) {
            // 1) Swap WETH -> USDT on low-fee pool
            TransferHelper.safeApprove(token, address(swapRouter), amount);
            uint256 usdtReceived = swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: token,
                    tokenOut: USDT,
                    fee: poolFeeLow,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: amount,
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                })
            );
            console.log('FlashSwap: swapped to USDT', usdtReceived);

            // 2) Swap USDT -> WETH on high-fee pool
            TransferHelper.safeApprove(USDT, address(swapRouter), usdtReceived);
            amountOut = swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: USDT,
                    tokenOut: token,
                    fee: poolFeeHigh,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: usdtReceived,
                    amountOutMinimum: amount + fee,
                    sqrtPriceLimitX96: 0
                })
            );
            console.log('FlashSwap: swapped back to WETH', amountOut);
        } else {
            // 1) Swap WETH -> USDT on high-fee pool
            TransferHelper.safeApprove(token, address(swapRouter), amount);
            uint256 usdtReceived = swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: token,
                    tokenOut: USDT,
                    fee: poolFeeHigh,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: amount,
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                })
            );
            console.log('FlashSwap: swapped to USDT', usdtReceived);

            // 2) Swap USDT -> WETH on low-fee pool
            TransferHelper.safeApprove(USDT, address(swapRouter), usdtReceived);
            amountOut = swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: USDT,
                    tokenOut: token,
                    fee: poolFeeLow,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: usdtReceived,
                    amountOutMinimum: amount + fee,
                    sqrtPriceLimitX96: 0
                })
            );
            console.log('FlashSwap: swapped back to WETH', amountOut);
        }
        require(amountOut > amount + fee, 'Arbitrage not profitable');
    }

    /// @notice Withdraw any native ETH stuck in contract
    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, 'No ETH');
        payable(owner).transfer(bal);
    }
}
