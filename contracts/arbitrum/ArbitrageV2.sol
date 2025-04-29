// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import 'hardhat/console.sol';
import '@pancakeswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';

import {FlashLoanProvider} from '../FlashLoanProvider.sol';

contract ArbitrageV2 is FlashLoanProvider {
    ISwapRouter private constant swapRouter =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    ISwapRouter private constant pancakeRouter =
        ISwapRouter(0x1b81D678ffb9C0263b24A97847620C99d213eB14);

    // Perform the arbitrage between Uniswap -> PancakeSwap
    function arbitrageDexes(
        bytes[] calldata forwardPaths,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external onlyOwner {
        require(amountIn > 0, 'Amount must be greater than 0');

        // Prepare flash loan arguments
        address[] memory tokens = new address[](1);
        tokens[0] = tokenIn;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amountIn;

        // Encode paths and tokens for callback
        bytes memory data = abi.encode(tokenOut, forwardPaths);

        flashLoan(tokens, amounts, data);
    }

    /// @dev Called by FlashLoanProvider after loan is received
    function _executeOperation(
        address tokenIn, // loanToken
        uint256 loanAmount,
        uint256 fee,
        bytes memory userData
    ) internal override {
        // Decode inputs
        (address tokenOut, bytes[] memory forwardPaths) = abi.decode(
            userData,
            (address, bytes[])
        );
        // Log the decoded values
        console.log('Executing operation with loan amount:', loanAmount);
        console.log('TokenIn:', tokenIn);
        console.log('TokenOut:', tokenOut);
        console.log('Fee:', fee);

        // 1. Get the output amount from Uniswap (tokenIn -> tokenOut)
        uint256 amountOut0 = swapUni(forwardPaths, tokenIn);
        console.log('amountOut0:', amountOut0);

        // 2. Get the output amount from PancakeSwap (tokenOut -> tokenIn)
        uint256 amountOut1 = swapPancake(tokenOut, tokenIn, amountOut0);
        console.log('amountOut1:', amountOut1);

        // 3. Calculate if arbitrage is profitable (amountOut1 > amountIn)
        require(amountOut1 > loanAmount, 'Arbitrage not profitable');

        console.log(
            'Arbitrage Successful: Profit from arbitrage:',
            amountOut1 - loanAmount
        );
    }

    // Function to get quote from Uniswap V3
    function swapUni(
        bytes[] memory forwardPaths,
        address tokenIn
    ) internal returns (uint256 outAmount) {
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
            console.log('AmountOut:', outAmount);
        }
    }

    function swapPancake(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal returns (uint256 amountOut) {
        TransferHelper.safeApprove(tokenIn, address(pancakeRouter), amountIn);
        amountOut = pancakeRouter.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: 500,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            })
        );
    }
}
