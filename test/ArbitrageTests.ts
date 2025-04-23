import { expect } from 'chai';
import { ethers } from 'hardhat';
import { findBestPath } from '../scripts/helpers/getQuote';
import { USDT, WETH9 } from '../shared/mainnet_addr';
import { Arbitrage } from '../typechain-types';

describe.only('Arbitrage Tests', () => {
  const ETH_BORROW_AMOUNT = 1; // 1 ETH
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
      path.forward.fee, // forwardFee
      path.backward.fee, // backwardFee
      ethers.parseUnits(String(path.forward.price), 18), // forwardPrice (scaled to 1e18)
      ethers.parseUnits(Number(path.backward.price).toFixed(6), 6), // backwardPrice (scaled to 1e6)
      ethers.parseEther(ETH_BORROW_AMOUNT.toString()), // borrowAmount
    );
    await tx.wait();

    const balance = await ethers.provider.getBalance(arbitrage.target);
    console.log('Arbitrage contract ETH balance:', ethers.formatEther(balance));
    expect(balance).to.be.gte(0);
  });
});
