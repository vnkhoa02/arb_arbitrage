// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract FlashSwap {
    address private constant UNISWAP_V3_ROUTER =
        0xE592427A0AEce92De3Edee1F18E0157C05861564; // Uniswap V3 SwapRouter address on Sepolia
    address private constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; // Replace with Sepolia USDC address
    address private constant WETH9 = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // Replace with Sepolia WETH address

    ISwapRouter public immutable swapRouter;
    address public owner;

    constructor() {
        swapRouter = ISwapRouter(UNISWAP_V3_ROUTER);
        owner = msg.sender; // Set the deployer as the owner
    }

    modifier onlyOwner() {
        require(msg.sender == owner, 'Not the contract owner');
        _;
    }

    function swapExactETHForUSDC(uint256 amountOutMinimum) external payable {
        require(msg.value > 0, 'Must send ETH');

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: WETH9,
                tokenOut: USDC,
                fee: 3000, // Pool fee (0.3%)
                recipient: msg.sender,
                deadline: block.timestamp,
                amountIn: msg.value,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0
            });

        // Perform the swap
        swapRouter.exactInputSingle{value: msg.value}(params);
    }

    // View the contract's ETH balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Withdraw ETH to the owner's address
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, 'No funds to withdraw');
        payable(owner).transfer(balance);
    }

    // Allow the contract to receive ETH
    receive() external payable {}
}
