// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import 'hardhat/console.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import {FlashLoanProvider} from '../FlashLoanProvider.sol';

contract SimpleArbitrage is FlashLoanProvider {
    ISwapRouter private constant swapRouter =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    /// @notice Initiates a flash-loan-backed arbitrage with custom Uniswap V3 paths
    /// @param tokenIn        The initial token to borrow and swap
    /// @param tokenOut       The intermediate token after forward swap
    /// @param forwardPath    Uniswap V3 path bytes for forward leg (tokenIn → ... → tokenOut)
    /// @param backwardPath   Uniswap V3 path bytes for backward leg (tokenOut → ... → tokenIn)
    /// @param borrowAmount   Amount of tokenIn to borrow and start with (TokenIn Amount)
    function simpleArbitrage(
        address tokenIn,
        address tokenOut,
        bytes calldata forwardPath,
        uint256 forwardOutMin,
        bytes calldata backwardPath,
        uint256 backwardOutMin,
        uint256 borrowAmount
    ) external onlyOwner {
        require(borrowAmount > 0, 'Invalid borrow amount');

        // Prepare flash loan arguments
        address[] memory tokens = new address[](1);
        tokens[0] = tokenIn;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = borrowAmount;

        // Encode paths and tokens for callback
        bytes memory data = abi.encode(
            tokenIn,
            tokenOut,
            forwardPath,
            forwardOutMin,
            backwardPath,
            backwardOutMin
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
        // Decode inputs
        (
            address tokenIn,
            address tokenOut,
            bytes memory forwardPath,
            uint256 forwardOutMin,
            bytes memory backwardPath,
            uint256 backwardOutMin
        ) = abi.decode(
                userData,
                (address, address, bytes, uint256, bytes, uint256)
            );

        // Log the decoded values
        console.log('Executing operation with loan amount:', amount);
        console.log('TokenIn:', tokenIn);
        console.log('TokenOut:', tokenOut);
        console.log('Amount to Swap:', amount);
        console.log('Fee:', fee);
        console.log('ForwardOutMin:', forwardOutMin);

        // 1) Forward multihop swap: tokenIn -> tokenOut
        TransferHelper.safeApprove(tokenIn, address(swapRouter), amount);
        uint256 outAmount = swapRouter.exactInput(
            ISwapRouter.ExactInputParams({
                path: forwardPath,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amount,
                amountOutMinimum: forwardOutMin
            })
        );

        // Log the output amount from the forward swap
        console.log('Output Amount from Forward Swap:', outAmount);
        require(outAmount > 0, 'Forward swap failed');

        console.log('backwardOutMin:', backwardOutMin);

        // 2) Backward multihop swap: tokenOut -> tokenIn
        TransferHelper.safeApprove(tokenOut, address(swapRouter), outAmount);
        uint256 finalAmount = swapRouter.exactInput(
            ISwapRouter.ExactInputParams({
                path: backwardPath,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: outAmount,
                amountOutMinimum: backwardOutMin
            })
        );

        // Log the final amount after the backward swap
        console.log('Final Amount from Backward Swap:', finalAmount);

        // Profit check: final received must cover loan + fee
        require(finalAmount > amount + fee, 'Arbitrage not profitable');
        console.log('Profit:', finalAmount - amount - fee);
    }
}
