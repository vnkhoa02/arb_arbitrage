import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import { DAI, WETH9 } from '../shared/mainnet_addr';
import { FlashSwap, IERC20, IWETH } from '../typechain-types';

const swapAmount = ethers.parseEther('0.01');

describe('FlashSwap (Mainnet Tests)', () => {
  let flashSwap: FlashSwap;
  let signer: Signer;
  let weth: IWETH;
  let dai: IERC20;

  before(async function () {
    [signer] = await ethers.getSigners();

    const factory = await ethers.getContractFactory('FlashSwap');
    flashSwap = await factory.deploy();
    await flashSwap.waitForDeployment();

    weth = (await ethers.getContractAt('IWETH', WETH9)) as IWETH;
    dai = (await ethers.getContractAt('IERC20', DAI)) as IERC20;
  });

  it('fetches latest ETH/USD price from Chainlink', async function () {
    const price = await flashSwap.getLatestETHPrice();
    console.log('ETH/USD Price from Chainlink:', price.toString());
    expect(price).to.be.gt(0);
  });

  it('executes WETH → DAI swap (exact input)', async function () {
    await weth.deposit({ value: swapAmount });
    const contractAddress = await flashSwap.getAddress();
    await weth.approve(contractAddress, swapAmount);

    await flashSwap.swapExactInputSingle(swapAmount);

    const daiBalance = await dai.balanceOf(await signer.getAddress());
    console.log('DAI balance after swap:', ethers.formatUnits(daiBalance, 18));
    expect(daiBalance).to.be.gt(0);
  });
});
