// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import {FlashLoanProvider} from '../FlashLoanProvider.sol';

contract EtherSimpleArbitrage is FlashLoanProvider {
    ISwapRouter private constant swapRouter =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    event ArbitrageStarted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountBorrowed
    );
    event ArbitrageCompleted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountBorrowed,
        uint256 profit
    );

    function simpleArbitrage(
        address tokenIn,
        address tokenOut,
        bytes[] calldata forwardPaths,
        bytes[] calldata backwardPaths,
        uint256 borrowAmount
    ) external onlyOwner {
        require(borrowAmount > 0, 'Invalid borrow amount');

        emit ArbitrageStarted(tokenIn, tokenOut, borrowAmount);

        // Prepare flash loan arguments
        address[] memory tokens = new address[](1);
        tokens[0] = tokenIn;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = borrowAmount;

        bytes memory data = abi.encode(tokenOut, forwardPaths, backwardPaths);

        flashLoan(tokens, amounts, data);
    }

    /// @dev Called by FlashLoanProvider after loan is received
    function _executeOperation(
        address borrowedToken,
        uint256 amountBorrowed,
        uint256 fee,
        bytes memory userData
    ) internal override nonReentrant {
        (
            address tokenOut,
            bytes[] memory forwardPaths,
            bytes[] memory backwardPaths
        ) = abi.decode(userData, (address, bytes[], bytes[]));

        // Approve router for borrowedToken
        TransferHelper.safeApprove(borrowedToken, address(swapRouter), 0);
        TransferHelper.safeApprove(
            borrowedToken,
            address(swapRouter),
            type(uint256).max
        );

        uint256 totalOut = 0;
        // Forward swaps: tokenIn -> tokenOut
        for (uint256 i = 0; i < forwardPaths.length; ) {
            (
                uint256 amountIn,
                uint256 amountOutMinimum,
                bytes memory path
            ) = abi.decode(forwardPaths[i], (uint256, uint256, bytes));
            totalOut += swapRouter.exactInput(
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

        // Approve router for tokenOut
        TransferHelper.safeApprove(tokenOut, address(swapRouter), 0);
        TransferHelper.safeApprove(
            tokenOut,
            address(swapRouter),
            type(uint256).max
        );

        uint256 totalFinal = 0;

        // Backward swaps: tokenOut -> tokenIn
        for (uint256 i = 0; i < backwardPaths.length; ) {
            (
                uint256 amountIn,
                uint256 amountOutMinimum,
                bytes memory path
            ) = abi.decode(backwardPaths[i], (uint256, uint256, bytes));

            totalFinal += swapRouter.exactInput(
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

        uint256 totalDebt = amountBorrowed + fee;
        require(totalFinal > totalDebt, 'Arbitrage not profitable');

        uint256 profit = totalFinal - totalDebt;

        emit ArbitrageCompleted(
            borrowedToken,
            tokenOut,
            amountBorrowed,
            profit
        );
    }
}
