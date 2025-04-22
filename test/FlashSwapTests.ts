import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import { DAI, WETH9 } from '../shared/mainnet_addr';
import { FlashSwap, IERC20, IWETH } from '../typechain-types';

const depositAmount = ethers.parseEther('0.01'); // 0.01 ETH
const swapAmount = ethers.parseEther('0.01');

describe('FlashSwap Tests', () => {
  let flashSwap: FlashSwap;
  let signer: Signer;
  let weth: IWETH;
  let dai: IERC20;

  before(async () => {
    const [deployer] = await ethers.getSigners();
    signer = deployer;

    const flashSwapFactory = await ethers.getContractFactory('FlashSwap');
    flashSwap = await flashSwapFactory.deploy();
    await flashSwap.waitForDeployment();

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

  it('swapExactInputSingle', async () => {
    await weth.deposit({ value: swapAmount });
    const address = await flashSwap.getAddress();
    await weth.approve(address, swapAmount);

    await flashSwap.swapExactInputSingle(swapAmount);

    const balance = await dai.balanceOf(await signer.getAddress());
    console.log('DAI balance after swapExactInputSingle:', balance.toString());
    expect(balance).to.be.gt(0);
  });

  it('should return the correct contract balance using getBalance', async () => {
    // Send x ETH to the contract
    const address = await flashSwap.getAddress();

    await signer.sendTransaction({
      to: address,
      value: depositAmount,
    });

    // Check the contract balance using getBalance
    const contractBalance = await flashSwap.getBalance();
    console.log('Contract Balance:', ethers.formatEther(contractBalance));
    expect(contractBalance).to.equal(depositAmount);
  });
});
