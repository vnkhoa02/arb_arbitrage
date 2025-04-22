import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import { FlashSwap, IERC20, IWETH } from '../typechain-types';
import { WETH9, DAI } from '../shared/mainnet_addr';

describe('FlashSwap Tests', () => {
  let flashSwap: FlashSwap;
  let signer: Signer;
  let weth: IWETH;
  let dai: IERC20;

  before(async () => {
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    signer = deployer;

    // Deploy the FlashSwap contract
    const flashSwapFactory = await ethers.getContractFactory('FlashSwap');
    flashSwap = await flashSwapFactory.deploy();
    await flashSwap.waitForDeployment();

    // Get contract instances for WETH and DAI
    weth = (await ethers.getContractAt('IWETH', WETH9)) as IWETH;
    dai = (await ethers.getContractAt('IERC20', DAI)) as IERC20;
  });

  it('should return the latest ETH price from Chainlink', async () => {
    // Fetch the latest ETH price from Chainlink
    const ethPrice = await flashSwap.getLatestETHPrice();
    console.log('ETH Price:', ethPrice.toString());

    // Ensure the price is greater than 0
    expect(ethPrice).to.be.gt(0);
  });

  it('should perform a single token swap (WETH to DAI)', async () => {
    const amountIn = ethers.parseEther('0.1'); // Amount of WETH to swap (0.1 WETH)
    // Deposit ETH and wrap it into WETH
    await weth.deposit({ value: amountIn });

    // Approve the FlashSwap contract to spend WETH
    const flashSwapAddress = await flashSwap.getAddress();
    await weth.approve(flashSwapAddress, amountIn);

    // Perform the swap
    await flashSwap.swapExactInputSingle(amountIn);

    // Check the DAI balance after the swap
    const daiBalance = await dai.balanceOf(await signer.getAddress());
    console.log(
      'DAI balance after swapExactInputSingle:',
      daiBalance.toString(),
    );
    expect(daiBalance).to.be.gt(0); // Ensure DAI balance increased
  });
});
