// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import 'hardhat/console.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import {FlashLoanProvider} from './FlashLoanProvider.sol';

contract Arbitrage is FlashLoanProvider {
    address public constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    ISwapRouter public constant swapRouter =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    uint24 private feeLow;
    uint24 private feeHigh;
    bool private isLowFirst;

    function simpleArbitrage(
        address tokenIn,
        uint24 _feeLow,
        uint24 _feeHigh,
        uint256 priceLow,
        uint256 priceHigh,
        uint256 borrowAmount
    ) external onlyOwner {
        require(borrowAmount > 0, 'Invalid amount');
        require(priceLow != priceHigh, 'No arbitrage opportunity');
        require(
            _feeLow == 500 || _feeLow == 3000 || _feeLow == 10000,
            'Invalid _feeLow'
        );
        require(
            _feeHigh == 500 || _feeHigh == 3000 || _feeHigh == 10000,
            'Invalid _feeHigh'
        );
        isLowFirst = priceLow < priceHigh;
        feeLow = _feeLow;
        feeHigh = _feeHigh;

        address[] memory tokens = new address[](1);
        tokens[0] = tokenIn;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = borrowAmount;

        bytes memory userData = abi.encode(tokenIn);

        flashLoan(tokens, amounts, userData);
    }

    function _executeOperation(
        address token,
        uint256 amount,
        uint256 fee,
        bytes memory
    ) internal override {
        uint256 usdtAmount;
        uint256 finalOut;
        // First swap
        TransferHelper.safeApprove(token, address(swapRouter), amount);
        usdtAmount = _swap(token, USDT, isLowFirst ? feeLow : feeHigh, amount);
        // Second swap
        TransferHelper.safeApprove(USDT, address(swapRouter), usdtAmount);
        finalOut = _swap(
            USDT,
            token,
            isLowFirst ? feeHigh : feeLow,
            usdtAmount
        );
        console.log(
            'Arb result: start=%s, final=%s, fee=%s',
            amount,
            finalOut,
            fee
        );
        require(finalOut > amount + fee, 'Arbitrage not profitable');
        console.log('Profit: %s', finalOut - amount - fee);
        // Repay the flash loan
        TransferHelper.safeApprove(token, VAULT_ADDRESS, amount + fee);
    }

    function _swap(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn
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
                    amountOutMinimum: 0, // consider using slippage protection
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
