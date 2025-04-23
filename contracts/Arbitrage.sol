// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import 'hardhat/console.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import '@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol';

import {FlashLoanProvider} from './FlashLoanProvider.sol';

contract Arbitrage is FlashLoanProvider {
    address public constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    IQuoter public quoter = IQuoter(0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6);
    ISwapRouter public constant swapRouter =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    uint24 private feeLow;
    uint24 private feeHigh;
    bool private isLowFirst;

    function simpleArbitrage(
        address tokenIn,
        uint24 _buyFee,
        uint24 _sellFee,
        uint256 buyPrice,
        uint256 sellPrice,
        uint256 borrowAmount
    ) external onlyOwner {
        require(borrowAmount > 0, 'Invalid amount');
        require(buyPrice != sellPrice, 'No arbitrage opportunity');

        isLowFirst = buyPrice < sellPrice;
        feeLow = _buyFee;
        feeHigh = _sellFee;

        address[] memory tokens = new address[](1);
        tokens[0] = tokenIn;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = borrowAmount;

        bytes memory userData = abi.encode(tokenIn, buyPrice, sellPrice);

        flashLoan(tokens, amounts, userData);
    }

    function _executeOperation(
        address /* token */,
        uint256 amount,
        uint256 fee,
        bytes memory userData
    ) internal override {
        // Extract the buy and sell prices from userData
        (address tokenIn, , ) = abi.decode(
            userData,
            (address, uint256, uint256)
        );

        uint256 usdtAmount;
        uint256 finalOut;

        // First swap
        TransferHelper.safeApprove(tokenIn, address(swapRouter), amount);
        usdtAmount = _swap(
            tokenIn,
            USDT,
            isLowFirst ? feeLow : feeHigh,
            amount
        );

        // Second swap
        TransferHelper.safeApprove(USDT, address(swapRouter), usdtAmount);
        finalOut = _swap(
            USDT,
            tokenIn,
            isLowFirst ? feeHigh : feeLow,
            usdtAmount
        );

        console.log(
            'Arb result: start=%s, final=%s, fee=%s',
            amount,
            finalOut,
            fee
        );

        // Check if the arbitrage is profitable
        uint256 profit = finalOut - amount - fee;
        require(profit > 0, 'Arbitrage not profitable');

        console.log('Profit: %s', profit);
        // Repay the flash loan
        TransferHelper.safeApprove(tokenIn, VAULT_ADDRESS, amount + fee);
    }

    function _swap(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn
    ) internal returns (uint256) {
        uint256 quote = quoter.quoteExactInputSingle(
            tokenIn,
            tokenOut,
            fee,
            amountIn,
            0
        );
        uint256 amountOutMinimum = (quote * 99) / 100;
        console.log(
            'AmountOutMinimum: %s -> in %s out -> %s',
            tokenIn,
            amountIn,
            amountOutMinimum
        );
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
