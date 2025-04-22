// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import '@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol';

contract GetQuote {
    IQuoter public quoter = IQuoter(0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6);

    function getEstimatedAmountOut(
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        uint24 poolFee
    ) external returns (uint256 amountOut) {
        require(amountIn > 0, 'Amount must be > 0');
        amountOut = quoter.quoteExactInputSingle(
            tokenIn,
            tokenOut,
            poolFee,
            amountIn,
            0
        );
    }
}
