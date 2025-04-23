// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import 'hardhat/console.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';

import {FlashLoanProvider} from './FlashLoanProvider.sol';

contract Arbitrage is FlashLoanProvider {
    ISwapRouter public constant swapRouter =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    function simpleArbitrage(
        address tokenIn,
        address tokenOut,
        uint24 forwardFee,
        uint24 backwardFee,
        uint256 forwardPrice,
        uint256 backwardPrice,
        uint256 borrowAmount
    ) external onlyOwner {
        require(borrowAmount > 0, 'Invalid amount');

        address[] memory tokens = new address[](1);
        tokens[0] = tokenIn;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = borrowAmount;

        bytes memory userData = abi.encode(
            tokenIn,
            tokenOut,
            forwardFee,
            backwardFee,
            forwardPrice,
            backwardPrice
        );

        flashLoan(tokens, amounts, userData);
    }

    function _executeOperation(
        address /* token */,
        uint256 amount,
        uint256 fee,
        bytes memory userData
    ) internal override {
        // Extract the buy and sell prices from userData
        (
            address tokenIn,
            address tokenOut,
            uint24 forwardFee,
            uint24 backwardFee,
            uint256 forwardPrice,
            uint256 backwardPrice
        ) = abi.decode(
                userData,
                (address, address, uint24, uint24, uint256, uint256)
            );

        uint256 expectedOut = 0;
        uint256 usdtAmount;
        uint256 finalOut;

        // Forward swap
        TransferHelper.safeApprove(tokenIn, address(swapRouter), amount);
        expectedOut = (forwardPrice * amount) / 1e18; // now in USDT (1e18 → 1e18 cancels)
        usdtAmount = _swap(tokenIn, tokenOut, forwardFee, amount, expectedOut);

        // Backward swap
        TransferHelper.safeApprove(tokenOut, address(swapRouter), usdtAmount);
        expectedOut = (backwardPrice * usdtAmount) / 1e18; // now in tokenIn (1e18 → 1e18 cancels)
        finalOut = _swap(
            tokenOut,
            tokenIn,
            backwardFee,
            usdtAmount,
            expectedOut
        );

        console.log(
            'Arb result: start=%s, final=%s, fee=%s',
            amount,
            finalOut,
            fee
        );
        require(finalOut > amount + fee, 'Arbitrage not profitable');
        console.log('Arbitrage profit: %s', finalOut - amount - fee);
        // Repay the flash loan
        TransferHelper.safeApprove(tokenIn, VAULT_ADDRESS, amount + fee);
    }

    function _swap(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint256 amountOutMinimum
    ) internal returns (uint256) {
        return
            swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: tokenIn,
                    tokenOut: tokenOut,
                    fee: fee,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: amountIn,
                    amountOutMinimum: amountOutMinimum,
                    sqrtPriceLimitX96: 0
                })
            );
    }

    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, 'No ETH');
        payable(owner).transfer(bal);
    }
}
