import { expect } from 'chai';
import { ethers } from 'hardhat';
import { FlashSwap, MockERC20 } from '../typechain-types';

describe('FlashSwap Contract', function () {
  let flashSwap: FlashSwap;
  let owner: any;
  let addr1: any;
  let USDC: MockERC20;
  let WETH: MockERC20;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    // Deploy the FlashSwap contract
    const FlashSwapFactory = await ethers.getContractFactory('FlashSwap');
    flashSwap = (await FlashSwapFactory.deploy()) as FlashSwap;
    await flashSwap.waitForDeployment();

    // Deploy Mock USDC token
    const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    USDC = (await MockERC20Factory.deploy('USD Coin', 'USDC', 6)) as MockERC20;
    await USDC.waitForDeployment();

    // Deploy Mock WETH token
    WETH = (await MockERC20Factory.deploy(
      'Wrapped Ether',
      'WETH',
      18,
    )) as MockERC20;
    await WETH.waitForDeployment();
  });

  describe('swapExactETHForUSDC', function () {
    it('should swap ETH for USDC correctly', async function () {
      const ethAmount = ethers.parseEther('0.01'); // 0.01 ETH
      // Perform the swap
      await flashSwap.connect(owner).swapExactETHForUSDC(ethAmount, {
        value: ethAmount,
      });
      // Check if the recipient got USDC
      const usdcBalance = await USDC.balanceOf(owner.address);
      expect(usdcBalance).to.be.above(0); // USDC balance of owner should increase
    });

    it('should fail if ETH sent is less than required', async function () {
      const ethAmount = ethers.parseEther('0.001'); // 0.001 ETH, below the minimum swap
      await expect(
        flashSwap
          .connect(owner)
          .swapExactETHForUSDC(ethAmount, { value: ethAmount }),
      ).to.be.revertedWith('Minimum swap is $5 worth of ETH');
    });

    it('should calculate minimum output correctly', async function () {
      const ethAmount = ethers.parseEther('0.01'); // 0.01 ETH
      const amountOutMin = await flashSwap.calculateAmountOutMinimum(ethAmount);

      // Check if amountOutMin is calculated properly based on the ETH price feed
      expect(amountOutMin).to.be.above(0);
    });

    it('should emit an event on successful swap', async function () {
      const ethAmount = ethers.parseEther('0.01'); // 0.01 ETH

      await expect(
        flashSwap.connect(owner).swapExactETHForUSDC(ethAmount, {
          value: ethAmount,
        }),
      )
        .to.emit(flashSwap, 'SwapExecuted')
        .withArgs(owner.address, ethAmount);
    });
  });
});
