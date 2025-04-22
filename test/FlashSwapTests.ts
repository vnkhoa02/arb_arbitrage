import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import { DAI, WETH9 } from '../shared/mainnet_addr';
import { FlashSwapArb, IERC20, IWETH } from '../typechain-types';

const depositAmount = ethers.parseEther('0.01');
const swapAmount = ethers.parseEther('0.01');

describe('FlashSwap (Mainnet Tests)', () => {
  let flashSwap: FlashSwapArb;
  let signer: Signer;
  let weth: IWETH;
  let dai: IERC20;

  const isMainnet = async () => {
    try {
      const { chainId } = await ethers.provider.getNetwork();
      console.log('Current chain ID:', chainId);
      // Check if the chain ID is 1 (Ethereum Mainnet)
      return chainId === BigInt(1);
    } catch (error) {
      console.error('Error fetching network:', error);
      return false;
    }
  };

  const skipIfNotMainnet = async function (this: Mocha.Context) {
    if (!(await isMainnet())) {
      console.log('Skipping test: not on mainnet');
      this.skip();
    }
  };

  before(async function () {
    await skipIfNotMainnet.call(this);
    [signer] = await ethers.getSigners();

    const factory = await ethers.getContractFactory('FlashSwapArb');
    flashSwap = await factory.deploy();
    await flashSwap.waitForDeployment();

    weth = (await ethers.getContractAt('IWETH', WETH9)) as IWETH;
    dai = (await ethers.getContractAt('IERC20', DAI)) as IERC20;
  });

  it('fetches latest ETH/USD price from Chainlink', async function () {
    await skipIfNotMainnet.call(this);

    const price = await flashSwap.getLatestETHPrice();
    console.log('ETH/USD Price from Chainlink:', price.toString());
    expect(price).to.be.gt(0);
  });

  it('executes WETH → DAI swap (exact input)', async function () {
    await skipIfNotMainnet.call(this);

    await weth.deposit({ value: swapAmount });
    const contractAddress = await flashSwap.getAddress();
    await weth.approve(contractAddress, swapAmount);

    await flashSwap.swapExactInputSingle(swapAmount);

    const daiBalance = await dai.balanceOf(await signer.getAddress());
    console.log('DAI balance after swap:', ethers.formatUnits(daiBalance, 18));
    expect(daiBalance).to.be.gt(0);
  });

  it('receives ETH and tracks contract balance', async function () {
    await skipIfNotMainnet.call(this);

    const contractAddress = await flashSwap.getAddress();
    await signer.sendTransaction({
      to: contractAddress,
      value: depositAmount,
    });

    const balance = await flashSwap.getBalance();
    console.log('Contract ETH Balance:', ethers.formatEther(balance));
    expect(balance).to.equal(depositAmount);
  });
});
