import { expect } from 'chai';
import { ethers } from 'hardhat';
import { FlashSwap, IERC20 } from '../typechain-types';

describe('FlashSwap Contract', function () {
  let flashSwap: FlashSwap;
  let owner: any;
  let addr1: any;
  let USDC: IERC20;
  let WETH: IERC20;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    // Deploy the FlashSwap contract
    const FlashSwapFactory = await ethers.getContractFactory('FlashSwap');
    flashSwap = (await FlashSwapFactory.deploy()) as FlashSwap;
    await flashSwap.waitForDeployment();

    // Deploy Mock USDC and WETH tokens
    const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    USDC = (await MockERC20Factory.deploy('USD Coin', 'USDC', 6)) as IERC20;
    await USDC.waitForDeployment();

    WETH = (await MockERC20Factory.deploy(
      'Wrapped Ether',
      'WETH',
      18,
    )) as IERC20;
    await WETH.waitForDeployment();
  });

  describe('swapExactETHForUSDC', function () {
    it('should swap ETH for USDC correctly', async function () {
      const ethAmount = ethers.parseEther('0.05'); // 0.05 ETH
      const expectedUSDC = 80750000; // 80.75 USDC (with slippage accounted for)

      // Perform the swap
      await flashSwap.connect(owner).swapExactETHForUSDC(expectedUSDC, {
        value: ethAmount,
      });

      // Check if the recipient got USDC
      const usdcBalance = await USDC.balanceOf(owner.address);
      expect(usdcBalance).to.be.above(0); // USDC balance of owner should increase
    });

    it('should fail if ETH sent is less than required', async function () {
      const ethAmount = ethers.parseEther('0.01'); // 0.01 ETH, below the minimum swap

      await expect(
        flashSwap.connect(owner).swapExactETHForUSDC(1, { value: ethAmount }),
      ).to.be.revertedWith('Minimum swap is $5 worth of ETH');
    });

    it('should fail if slippage is too high', async function () {
      const ethAmount = ethers.parseEther('0.05'); // 0.05 ETH
      const highSlippageUSDC = 90000000; // 90 USDC (higher than expected)

      await expect(
        flashSwap.connect(owner).swapExactETHForUSDC(highSlippageUSDC, {
          value: ethAmount,
        }),
      ).to.be.revertedWith('UniswapV3: INSUFFICIENT_OUTPUT_AMOUNT');
    });

    it('should calculate minimum output correctly', async function () {
      const ethAmount = ethers.parseEther('0.05'); // 0.05 ETH
      const amountOutMin = await flashSwap.calculateAmountOutMinimum(ethAmount);

      // Check if amountOutMin is calculated properly based on the ETH price feed
      expect(amountOutMin).to.be.above(0);
      expect(amountOutMin).to.equal(80750000); // 80.75 USDC
    });

    it('should emit an event on successful swap', async function () {
      const ethAmount = ethers.parseEther('0.05'); // 0.05 ETH
      const expectedUSDC = 80750000; // 80.75 USDC

      await expect(
        flashSwap.connect(owner).swapExactETHForUSDC(expectedUSDC, {
          value: ethAmount,
        }),
      )
        .to.emit(flashSwap, 'SwapExecuted')
        .withArgs(owner.address, ethAmount, expectedUSDC);
    });
  });
});
