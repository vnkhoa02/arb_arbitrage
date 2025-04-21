// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {AggregatorV3Interface} from '@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol';
import 'hardhat/console.sol'; // Add this line

contract FlashSwap {
    address private constant UNISWAP_V3_ROUTER =
        0xE592427A0AEce92De3Edee1F18E0157C05861564; // Sepolia
    address private constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; // Sepolia USDC address
    address private constant WETH9 = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // Sepolia WETH address
    address private constant CHAINLINK_ETH_USD_FEED =
        0x694AA1769357215DE4FAC081bf1f309aDC325306; // Sepolia

    uint256 private constant MIN_SWAP_USD = 5 * 10 ** 8; // $5 in 8 decimals
    uint256 private constant SLIPPAGE_BPS = 100; // 1% slippage (basis points)

    ISwapRouter public immutable swapRouter;
    AggregatorV3Interface internal priceFeed;
    address public owner;

    constructor() {
        swapRouter = ISwapRouter(UNISWAP_V3_ROUTER);
        priceFeed = AggregatorV3Interface(CHAINLINK_ETH_USD_FEED);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, 'Not the contract owner');
        _;
    }

    function getLatestETHPrice() public view returns (uint256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, 'Invalid price');
        return uint256(price);
    }

    function calculateAmountOutMinimum(
        uint256 amountIn
    ) public view returns (uint256) {
        uint256 ethPrice = getLatestETHPrice();
        uint256 usdValue = (amountIn * ethPrice) / 1e8;
        require(usdValue >= MIN_SWAP_USD, 'Minimum swap is $5 worth of ETH');

        uint256 amountOutMin = (usdValue * (10_000 - SLIPPAGE_BPS)) / 10_000;
        return (amountOutMin * 1e6) / 1e8; // Convert to USDC 6 decimals
    }

    function swapExactETHForUSDC(uint256 amountIn) external payable {
        console.log('msg.value: ', msg.value);
        console.log('amountIn: ', amountIn);

        require(amountIn > 0, 'Must specify ETH amount');
        require(msg.value == amountIn, 'ETH sent does not match amountIn');

        uint256 ethPrice = getLatestETHPrice();
        uint256 usdValue = (amountIn * ethPrice) / 1e8;
        // uint256 amountOutMin = calculateAmountOutMinimum(amountIn);

        console.log('ETH Price:', ethPrice);
        console.log('USD Value:', usdValue);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: WETH9,
                tokenOut: USDC,
                fee: 3000, // Pool fee (0.3%)
                recipient: msg.sender,
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        // Perform the swap
        swapRouter.exactInputSingle{value: amountIn}(params);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, 'No funds to withdraw');
        payable(owner).transfer(balance);
    }

    receive() external payable {}
}
