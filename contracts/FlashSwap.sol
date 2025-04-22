// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {AggregatorV3Interface} from '@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol';
import 'hardhat/console.sol'; // Add this line

contract FlashSwap {
    address private constant UNISWAP_V3_ROUTER =
        0xE592427A0AEce92De3Edee1F18E0157C05861564;
    ISwapRouter public constant swapRouter = ISwapRouter(UNISWAP_V3_ROUTER);
    address private constant CHAINLINK_ETH_USD_FEED =
        0x694AA1769357215DE4FAC081bf1f309aDC325306; // Sepolia Testnet
    AggregatorV3Interface internal priceFeed =
        AggregatorV3Interface(CHAINLINK_ETH_USD_FEED);

    address private constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F; // DAI Mainnet
    address private constant WETH9 = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // WETH Mainnet
    uint256 private constant MIN_SWAP_USD = 5 * 10 ** 8; // $5 in 8 decimals
    uint256 private constant SLIPPAGE_BPS = 100; // 1% slippage (basis points)

    address public owner;

    constructor() {
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

    /// @notice Swaps a fixed amount of WETH for a maximum possible amount of DAI
    function swapExactInputSingle(
        uint amountIn
    ) external returns (uint amountOut) {
        TransferHelper.safeTransferFrom(
            WETH9,
            msg.sender,
            address(this),
            amountIn
        );
        TransferHelper.safeApprove(WETH9, address(swapRouter), amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: WETH9,
                tokenOut: DAI,
                //  0.3% fee,
                fee: 3000,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        amountOut = swapRouter.exactInputSingle(params);
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
