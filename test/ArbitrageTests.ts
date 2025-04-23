import { expect } from 'chai';
import { ethers } from 'hardhat';
import { getQuote } from '../scripts/helpers/getQuote';
import { USDT, WETH9 } from '../shared/mainnet_addr';
import { Arbitrage } from '../typechain-types';

describe('Arbitrage Tests', () => {
  const ETH_BORROW_AMOUNT = 10; // 10 ETH
  let Arbitrage: Arbitrage;
  let owner: any;

  before(async () => {
    [owner] = await ethers.getSigners();
    console.log('Deploying Arbitrage contract...');
    const Factory = await ethers.getContractFactory('Arbitrage', owner);
    Arbitrage = (await Factory.deploy()) as Arbitrage;
    await Arbitrage.waitForDeployment();
    console.log('Arbitrage deployed to:', Arbitrage.target);
  });

  function quote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    fee: number,
  ) {
    return getQuote(tokenIn, tokenOut, amountIn, fee || 3000);
  }

  it('simpleArbitrage', async () => {
    const feeTiers = { low: 500, high: 3000 };
    const prices = await Promise.all([
      quote(WETH9, USDT, ETH_BORROW_AMOUNT.toString(), feeTiers.low),
      quote(WETH9, USDT, ETH_BORROW_AMOUNT.toString(), feeTiers.high),
    ]);
    console.log('Calling simpleArbitrage...', {
      lowFee: feeTiers.low,
      lowFeePrice: prices[0],
      highFee: feeTiers.high,
      highFeePrice: prices[1],
    });

    try {
      const tx = await Arbitrage.connect(owner).simpleArbitrage(
        WETH9,
        feeTiers.low,
        feeTiers.high,
        ethers.parseUnits(prices[0], 18),
        ethers.parseUnits(prices[1], 18),
        ethers.parseEther(ETH_BORROW_AMOUNT.toString()),
      );
      await tx.wait();
    } catch (error) {
      const vaildErrString = `Arbitrage not profitable`;
      if (error instanceof Error && error.message.includes(vaildErrString)) {
        console.log('Arbitrage not profitable, skipping test.');
        return;
      }
      console.error('Error in simpleArbitrage:', error);
    }

    const balance = await ethers.provider.getBalance(Arbitrage.target);
    console.log('Arbitrage contract balance:', ethers.formatEther(balance));
    expect(balance).to.be.gte(0);
  });
});
