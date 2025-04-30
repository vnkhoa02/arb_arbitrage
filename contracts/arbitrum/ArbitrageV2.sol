// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import {FlashLoanProvider} from '../FlashLoanProvider.sol';

contract ArbitrageV2 is FlashLoanProvider {
    ISwapRouter private constant swapRouter =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    ISwapRouter private constant pancakeRouter =
        ISwapRouter(0x1b81D678ffb9C0263b24A97847620C99d213eB14);

    /// @notice Emitted when an arbitrage is initiated
    event ArbitrageStarted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountBorrowed
    );

    /// @notice Emitted when an arbitrage completes successfully
    event ArbitrageCompleted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountBorrowed,
        uint256 profit
    );

    /// @notice Perform arbitrage between Uniswap V3 and PancakeSwap
    function arbitrageDexes(
        bytes[] calldata forwardPaths,
        address tokenIn,
        address tokenOut,
        uint256 borrowAmount
    ) external onlyOwner {
        require(borrowAmount > 0, 'Amount must be > 0');

        emit ArbitrageStarted(tokenIn, tokenOut, borrowAmount);

        // Prepare flash loan
        address[] memory tokens = new address[](1);
        tokens[0] = tokenIn;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = borrowAmount;
        bytes memory data = abi.encode(tokenOut, forwardPaths);

        flashLoan(tokens, amounts, data);
    }

    /// @dev FlashLoanProvider callback
    function _executeOperation(
        address borrowedToken,
        uint256 amountBorrowed,
        uint256,
        bytes memory userData
    ) internal override nonReentrant {
        (address tokenOut, bytes[] memory forwardPaths) = abi.decode(
            userData,
            (address, bytes[])
        );

        // 1. Swap on Uniswap V3
        uint256 amountOut0 = swapUni(forwardPaths, borrowedToken);

        // 2. Swap back on PancakeSwap
        uint256 amountOut1 = swapPancake(tokenOut, borrowedToken, amountOut0);

        // 3. Ensure profitability
        require(amountOut1 > amountBorrowed, 'Arbitrage not profitable');

        // 4. Calculate profit and transfer to owner
        uint256 profit = amountOut1 - amountBorrowed;
        TransferHelper.safeTransfer(borrowedToken, owner, profit);

        emit ArbitrageCompleted(
            borrowedToken,
            tokenOut,
            amountBorrowed,
            profit
        );
    }

    /// @dev Executes exact-input swaps on Uniswap V3
    function swapUni(
        bytes[] memory forwardPaths,
        address tokenIn
    ) internal returns (uint256 outAmount) {
        for (uint256 i = 0; i < forwardPaths.length; ) {
            (
                uint256 amountIn,
                uint256 amountOutMinimum,
                bytes memory path
            ) = abi.decode(forwardPaths[i], (uint256, uint256, bytes));

            // Reset and set approval
            TransferHelper.safeApprove(tokenIn, address(swapRouter), 0);
            TransferHelper.safeApprove(tokenIn, address(swapRouter), amountIn);

            outAmount += swapRouter.exactInput(
                ISwapRouter.ExactInputParams({
                    path: path,
                    recipient: address(this),
                    deadline: block.timestamp + 1 minutes,
                    amountIn: amountIn,
                    amountOutMinimum: amountOutMinimum
                })
            );

            unchecked {
                i++;
            }
        }
    }

    /// @dev Executes an exact-input single swap on PancakeSwap
    function swapPancake(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal returns (uint256 amountOut) {
        // Reset and set approval
        TransferHelper.safeApprove(tokenIn, address(pancakeRouter), 0);
        TransferHelper.safeApprove(tokenIn, address(pancakeRouter), amountIn);

        amountOut = pancakeRouter.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: 500,
                recipient: address(this),
                deadline: block.timestamp + 1 minutes,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            })
        );
    }
}
