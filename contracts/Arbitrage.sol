// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import 'hardhat/console.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import '@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol';

import {FlashLoanProvider} from './FlashLoanProvider.sol';

contract Arbitrage is FlashLoanProvider {
    IQuoter public quoter = IQuoter(0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6);
    ISwapRouter public constant swapRouter =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    uint24 private feeLow;
    uint24 private feeHigh;
    bool private isLowFirst;

    function simpleArbitrage(
        address tokenIn,
        address tokenOut,
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

        bytes memory userData = abi.encode(
            tokenIn,
            tokenOut,
            buyPrice,
            sellPrice
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
            uint256 buyPrice,
            uint256 sellPrice
        ) = abi.decode(userData, (address, address, uint256, uint256));

        uint256 amountOutMinimum;
        uint256 usdtAmount;
        uint256 finalOut;

        // First swap
        TransferHelper.safeApprove(tokenIn, address(swapRouter), amount);
        amountOutMinimum = (buyPrice * amount) / 1e18;
        usdtAmount = _swap(
            tokenIn,
            tokenOut,
            isLowFirst ? feeLow : feeHigh,
            amount,
            amountOutMinimum
        );

        // Second swap
        TransferHelper.safeApprove(tokenOut, address(swapRouter), usdtAmount);
        amountOutMinimum = (sellPrice * amount) / 1e18;
        finalOut = _swap(
            tokenOut,
            tokenIn,
            isLowFirst ? feeHigh : feeLow,
            usdtAmount,
            amountOutMinimum
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
