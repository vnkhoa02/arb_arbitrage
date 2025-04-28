// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import 'hardhat/console.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';

import {FlashLoanProvider} from '../../FlashLoanProvider.sol';

contract FlashLoanSwapMock is FlashLoanProvider {
    ISwapRouter public constant swapRouter =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    /// @notice Initiates a flash loan and then swaps tokenIn to tokenOut
    /// @param tokenIn  Token to borrow
    /// @param tokenOut Token to swap to
    /// @param path     Uniswap V3 path (tokenIn -> tokenOut)
    /// @param borrowAmount Amount of tokenIn to flash loan
    /// @param minAmountOut Minimum amount of tokenOut expected from swap
    function flashLoanAndSwap(
        address tokenIn,
        address tokenOut,
        bytes calldata path,
        uint256 borrowAmount,
        uint256 minAmountOut
    ) external onlyOwner {
        require(borrowAmount > 0, 'Amount must be > 0');

        // Prepare flash loan arguments
        address[] memory tokens = new address[](1);
        tokens[0] = tokenIn;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = borrowAmount;

        // Encode swap data for later use
        bytes memory data = abi.encode(tokenOut, path, minAmountOut);

        flashLoan(tokens, amounts, data);
    }

    /// @dev Called after flashloan funds are received
    function _executeOperation(
        address borrowedToken,
        uint256 amountBorrowed,
        uint256 fee,
        bytes memory userData
    ) internal override {
        (address targetToken, bytes memory path, uint256 minAmountOut) = abi
            .decode(userData, (address, bytes, uint256));

        console.log('Flash loan received:', amountBorrowed);
        console.log('Borrowed Token:', borrowedToken);
        console.log('Target Token:', targetToken);

        // Approve Uniswap router to spend borrowed token
        TransferHelper.safeApprove(
            borrowedToken,
            address(swapRouter),
            amountBorrowed
        );

        // Perform the swap
        uint256 amountOut = swapRouter.exactInput(
            ISwapRouter.ExactInputParams({
                path: path,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountBorrowed,
                amountOutMinimum: minAmountOut
            })
        );

        console.log('Swapped. Received:', amountOut);

        // Repay flash loan
        uint256 totalDebt = amountBorrowed + fee;
        require(
            IERC20(borrowedToken).balanceOf(address(this)) >= totalDebt,
            'Not enough to repay loan'
        );
    }
}
