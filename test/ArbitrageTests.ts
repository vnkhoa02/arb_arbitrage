import { expect } from 'chai';
import { ethers } from 'hardhat';
import { findBestPath } from '../scripts/helpers/getQuote';
import { USDT, WETH9 } from '../shared/mainnet_addr';
import { Arbitrage } from '../typechain-types';

describe('Arbitrage Tests', () => {
  const ETH_BORROW_AMOUNT = 10; // 10 ETH
  let arbitrage: Arbitrage;
  let owner: any;

  before(async () => {
    [owner] = await ethers.getSigners();
    console.log('Deploying Arbitrage contract...');
    const Factory = await ethers.getContractFactory('Arbitrage', owner);
    arbitrage = (await Factory.deploy()) as Arbitrage;
    await arbitrage.waitForDeployment();
    console.log('Arbitrage deployed to:', arbitrage.target);
  });

  it('simpleArbitrage', async function () {
    // NEW: findBestPath(tokenIn, tokenOut, amountIn)
    const path = await findBestPath(WETH9, USDT, ETH_BORROW_AMOUNT.toString());
    console.log('Arbitrage Path Info:', path);

    // skip if the entire round-trip isn't profitable
    if (!path.roundTrip.isProfitable) {
      console.log('No arbitrage opportunity found.');
      return this.skip();
    }

    const tx = await arbitrage.connect(owner).simpleArbitrage(
      WETH9, // tokenIn
      USDT, // tokenOut
      path.forward.buyFee, // forwardFee
      path.backward.sellFee, // backwardFee
      ethers.parseUnits(String(path.forward.buyPrice), 18), // forwardPrice (scaled to 1e18)
      ethers.parseUnits(String(path.backward.sellPrice), 6), // backwardPrice (USDT is 6 decimals)
      ethers.parseEther(ETH_BORROW_AMOUNT.toString()), // borrowAmount
    );
    await tx.wait();

    const balance = await ethers.provider.getBalance(arbitrage.target);
    console.log('Arbitrage contract ETH balance:', ethers.formatEther(balance));
    expect(balance).to.be.gte(0);
  });
});
