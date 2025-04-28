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
        bytes memory forwardPath,
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
        bytes memory data = abi.encode(tokenOut, forwardPath);

        flashLoan(tokens, amounts, data);
    }

    /// @dev Called by FlashLoanProvider after loan is received
    function _executeOperation(
        address tokenIn, // loanToken
        uint256 amountIn,
        uint256 fee,
        bytes memory userData
    ) internal override {
        // Decode inputs
        (address tokenOut, bytes memory forwardPath) = abi.decode(
            userData,
            (address, bytes)
        );

        // Log the decoded values
        console.log('Executing operation with loan amount:', amountIn);
        console.log('TokenIn:', tokenIn);
        console.log('TokenOut:', tokenOut);
        console.log('Amount to Swap:', amountIn);
        console.log('Fee:', fee);

        // 1. Get the output amount from Uniswap (tokenIn -> tokenOut)
        uint256 amountOut0 = swapUni(forwardPath, tokenIn, amountIn);

        // 2. Get the output amount from PancakeSwap (tokenOut -> tokenIn)
        uint256 amountOut1 = swapPancake(tokenOut, tokenIn, amountOut0);

        // 3. Calculate if arbitrage is profitable (amountOut1 > amountIn)
        require(amountOut1 > amountIn, 'Arbitrage not profitable');

        console.log(
            'Arbitrage Successful: Profit from arbitrage:',
            amountOut1 - amountIn
        );
    }

    // Function to get quote from Uniswap V3
    function swapUni(
        bytes memory path,
        address tokenIn,
        uint256 amountIn
    ) internal returns (uint256 amountOut) {
        TransferHelper.safeApprove(tokenIn, address(swapRouter), amountIn);
        amountOut = swapRouter.exactInput(
            ISwapRouter.ExactInputParams({
                path: path,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0
            })
        );
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
