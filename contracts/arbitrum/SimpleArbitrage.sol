// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import {FlashLoanProvider} from '../FlashLoanProvider.sol';

contract SimpleArbitrage is FlashLoanProvider {
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
        uint256 amountPerForward = amountBorrowed / forwardPaths.length;

        // Forward swaps: tokenIn -> tokenOut
        for (uint256 i = 0; i < forwardPaths.length; ) {
            uint256 thisAmountIn = (i == forwardPaths.length - 1)
                ? amountBorrowed - (amountPerForward * i) // handle remainder
                : amountPerForward;

            totalOut += swapRouter.exactInput(
                ISwapRouter.ExactInputParams({
                    path: forwardPaths[i],
                    recipient: address(this),
                    deadline: block.timestamp + 1 minutes,
                    amountIn: thisAmountIn,
                    amountOutMinimum: 0
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
        uint256 amountPerBackward = totalOut / backwardPaths.length;

        // Backward swaps: tokenOut -> tokenIn
        for (uint256 i = 0; i < backwardPaths.length; ) {
            uint256 thisAmountIn = (i == backwardPaths.length - 1)
                ? totalOut - (amountPerBackward * i)
                : amountPerBackward;

            totalFinal += swapRouter.exactInput(
                ISwapRouter.ExactInputParams({
                    path: backwardPaths[i],
                    recipient: address(this),
                    deadline: block.timestamp + 1 minutes,
                    amountIn: thisAmountIn,
                    amountOutMinimum: 0
                })
            );

            unchecked {
                i++;
            }
        }

        uint256 totalDebt = amountBorrowed + fee;
        require(totalFinal > totalDebt, 'Arbitrage not profitable');

        uint256 profit = totalFinal - totalDebt;

        // Transfer profit to owner
        TransferHelper.safeTransfer(borrowedToken, owner, profit);

        emit ArbitrageCompleted(
            borrowedToken,
            tokenOut,
            amountBorrowed,
            profit
        );
    }
}
