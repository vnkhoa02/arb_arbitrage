import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import { DAI, UNISWAP_QUOTER, WETH9 } from '../shared/mainnet_addr';
import { IQuoter, GetQuote } from '../typechain-types';

const swapAmount = ethers.parseEther('1'); // 1 ETH

describe('GetQuote (Mainnet Tests)', () => {
  let quoteContract: GetQuote;
  let signer: Signer;
  let quoter: IQuoter;

  const isMainnet = async () => {
    try {
      const { chainId } = await ethers.provider.getNetwork();
      // Chain ID = 1 (Ethereum Mainnet)
      // Chain ID = 31337 (Hardhat Network)
      return chainId === BigInt(1) || chainId === BigInt(31337);
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

    const factory = await ethers.getContractFactory('GetQuote');
    quoteContract = await factory.deploy();
    await quoteContract.waitForDeployment();

    quoter = (await ethers.getContractAt('IQuoter', UNISWAP_QUOTER)) as IQuoter;
  });

  it('fetches quote for 1 ETH → USDC', async function () {
    await skipIfNotMainnet.call(this);

    const quote = await quoteContract.getEstimatedAmountOut(
      WETH9,
      swapAmount,
      DAI,
      3000,
    );

    console.log('Estimated output for 1 ETH → DAI:', quote);
    expect(quote).to.be.gt(0);
  });

  it('fetches quote for 0.5 ETH → USDC', async function () {
    await skipIfNotMainnet.call(this);

    const halfSwapAmount = ethers.parseEther('0.5');
    const quote = await quoteContract.getEstimatedAmountOut(
      WETH9,
      halfSwapAmount,
      DAI,
      3000,
    );
    console.log('Estimated output for 0.5 ETH → DAI:', quote);
    expect(quote).to.be.gt(0);
  });

  it('handles an invalid input amount gracefully', async function () {
    await skipIfNotMainnet.call(this);

    const invalidSwapAmount = ethers.toBigInt(0); // Invalid, 0 ETH
    await expect(
      quoteContract.getEstimatedAmountOut(WETH9, invalidSwapAmount, DAI, 3000),
    ).to.be.revertedWith('Amount must be > 0');
  });
});
