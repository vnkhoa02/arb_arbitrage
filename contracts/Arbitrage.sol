// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import 'hardhat/console.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';

import {FlashLoanProvider} from './FlashLoanProvider.sol';

contract Arbitrage is FlashLoanProvider {
    ISwapRouter public constant swapRouter =
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
        bytes calldata backwardPath,
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
            backwardPath
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
            bytes memory backwardPath
        ) = abi.decode(userData, (address, address, bytes, bytes));

        // Log the decoded values
        console.log('Executing operation with:');
        console.log('TokenIn:', tokenIn);
        console.log('TokenOut:', tokenOut);
        console.log('Amount to Swap:', amount);
        console.log('Fee:', fee);

        // 1) Forward multihop swap: tokenIn -> tokenOut
        TransferHelper.safeApprove(tokenIn, address(swapRouter), amount);
        uint256 outAmount = swapRouter.exactInput(
            ISwapRouter.ExactInputParams({
                path: forwardPath,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amount,
                amountOutMinimum: 0
            })
        );

        // Log the output amount from the forward swap
        console.log('Output Amount from Forward Swap:', outAmount);
        require(outAmount > 0, 'Forward swap failed');

        // 2) Backward multihop swap: tokenOut -> tokenIn
        TransferHelper.safeApprove(tokenOut, address(swapRouter), outAmount);
        uint256 finalAmount = swapRouter.exactInput(
            ISwapRouter.ExactInputParams({
                path: backwardPath,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: outAmount,
                amountOutMinimum: 0
            })
        );

        // Log the final amount after the backward swap
        console.log('Final Amount from Backward Swap:', finalAmount);

        // Profit check: final received must cover loan + fee
        require(finalAmount > amount + fee, 'Arbitrage not profitable');
        console.log('Profit:', finalAmount - amount - fee);
    }

    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, 'No ETH');
        payable(owner).transfer(bal);
    }
}
