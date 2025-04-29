// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import 'hardhat/console.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';

import {FlashLoanProvider} from '../../FlashLoanProvider.sol';

contract FlashLoanSwapMock is FlashLoanProvider {
    ISwapRouter public constant swapRouter =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    function flashLoanAndSwap(
        bytes[] calldata forwardPaths,
        address tokenIn,
        address tokenOut,
        uint256 borrowAmount
    ) external onlyOwner {
        require(borrowAmount > 0, 'Amount must be > 0');

        // Prepare flash loan arguments
        address[] memory tokens = new address[](1);
        tokens[0] = tokenIn;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = borrowAmount;

        // Encode swap data for later use
        bytes memory data = abi.encode(tokenOut, forwardPaths);

        flashLoan(tokens, amounts, data);
    }

    /// @dev Called after flashloan funds are received
    function _executeOperation(
        address borrowedToken,
        uint256 amountBorrowed,
        uint256 fee,
        bytes memory userData
    ) internal override {
        (address targetToken, bytes[] memory forwardPaths) = abi.decode(
            userData,
            (address, bytes[])
        );

        console.log('Flash loan received:', amountBorrowed);
        console.log('Borrowed Token:', borrowedToken);
        console.log('Target Token:', targetToken);

        TransferHelper.safeApprove(
            borrowedToken,
            address(swapRouter),
            amountBorrowed
        );

        uint256 outAmount;
        for (uint256 i = 0; i < forwardPaths.length; i++) {
            (uint256 amountIn, bytes memory path) = abi.decode(
                forwardPaths[i],
                (uint256, bytes)
            );
            console.log('Forward swap #%s', i);
            console.log('AmountIn:', amountIn);
            console.logBytes(path);
            outAmount += swapRouter.exactInput(
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

        // Repay flash loan
        uint256 totalDebt = amountBorrowed + fee;
        require(
            IERC20(borrowedToken).balanceOf(address(this)) >= totalDebt,
            'Not enough to repay loan'
        );
    }
}
