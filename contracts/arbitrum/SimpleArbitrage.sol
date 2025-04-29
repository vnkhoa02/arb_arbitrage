// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import 'hardhat/console.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import {FlashLoanProvider} from '../FlashLoanProvider.sol';

contract SimpleArbitrage is FlashLoanProvider {
    ISwapRouter private constant swapRouter =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    function simpleArbitrage(
        address tokenIn,
        address tokenOut,
        bytes[] calldata forwardPaths,
        bytes[] calldata backwardPaths,
        uint256 borrowAmount
    ) external onlyOwner {
        require(borrowAmount > 0, 'Invalid borrow amount');

        console.log('Initiating arbitrage:');
        console.log('TokenIn:', tokenIn);
        console.log('TokenOut:', tokenOut);
        console.log('Borrow Amount:', borrowAmount);

        // Prepare flash loan arguments
        address[] memory tokens = new address[](1);
        tokens[0] = tokenIn;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = borrowAmount;

        bytes memory data = abi.encode(
            tokenIn,
            tokenOut,
            forwardPaths,
            backwardPaths
        );

        flashLoan(tokens, amounts, data);
    }

    /// @dev Called by FlashLoanProvider after loan is received
    function _executeOperation(
        address, // loanToken
        uint256 amount,
        uint256 fee,
        bytes memory userData
    ) internal override {
        (
            address tokenIn,
            address tokenOut,
            bytes memory forwardPathsEncoded,
            bytes memory backwardPathsEncoded
        ) = abi.decode(userData, (address, address, bytes, bytes));

        console.log('Flash loan received:');
        console.log('TokenIn:', tokenIn);
        console.log('TokenOut:', tokenOut);
        console.log('Loan amount:', amount);
        console.log('Loan fee:', fee);

        bytes[] memory forwardPaths = abi.decode(
            forwardPathsEncoded,
            (bytes[])
        );
        bytes[] memory backwardPaths = abi.decode(
            backwardPathsEncoded,
            (bytes[])
        );

        uint256 outAmount;

        // 1. Forward swaps
        for (uint256 i = 0; i < forwardPaths.length; i++) {
            (uint256 amountIn, bytes memory path) = abi.decode(
                forwardPaths[i],
                (uint256, bytes)
            );

            console.log('Forward swap #%s', i);
            console.log('AmountIn:', amountIn);
            console.logBytes(path);

            TransferHelper.safeApprove(tokenIn, address(swapRouter), amountIn);
            outAmount = swapRouter.exactInput(
                ISwapRouter.ExactInputParams({
                    path: path,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: amountIn,
                    amountOutMinimum: 0
                })
            );
        }

        // 2. Backward swaps (tokenOut -> tokenIn)
        uint256 finalAmount;
        for (uint256 i = 0; i < backwardPaths.length; i++) {
            (uint256 amountIn, bytes memory path) = abi.decode(
                backwardPaths[i],
                (uint256, bytes)
            );

            console.log('Backward swap #%s', i);
            console.log('AmountIn:', amountIn);
            console.logBytes(path);

            TransferHelper.safeApprove(tokenOut, address(swapRouter), amountIn);
            finalAmount = swapRouter.exactInput(
                ISwapRouter.ExactInputParams({
                    path: path,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: amountIn,
                    amountOutMinimum: 0
                })
            );
        }

        console.log('Final amount after backward swaps:', finalAmount);
        console.log('Total debt (loan + fee):', amount + fee);

        // Final profit check
        require(finalAmount > amount + fee, 'Arbitrage not profitable');
    }
}
