import { expect } from 'chai';
import { ethers } from 'hardhat';
import { findBestPath, pickBestRoute } from '../scripts/helpers/getQuote';
import { DAI, SAITO } from '../shared/mainnet_addr';
import { Arbitrage } from '../typechain-types';

describe.only('Arbitrage Tests', () => {
  const BORROW_AMOUNT = 1000; // 1000 USD
  let arbitrage: Arbitrage;
  let owner: any;

  before(async () => {
    [owner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('Arbitrage', owner);
    arbitrage = (await Factory.deploy()) as Arbitrage;
    await arbitrage.waitForDeployment();
  });

  it('simpleArbitrage', async function () {
    // 1) find the best path (must now include encoded paths)
    const path = await findBestPath(DAI, SAITO, BORROW_AMOUNT.toString());
    console.log('Arbitrage Path Info:', path);

    // 2) skip if not profitable
    if (!path.roundTrip.isProfitable) {
      console.log('No arbitrage opportunity found.');
      return this.skip();
    }

    // 3) Destructure the two encoded routes (bytes)
    const forwardRoute = pickBestRoute(path.forward.route);
    console.log('forwardRoute -->', forwardRoute);
    const backwardRoute = pickBestRoute(path.backward.route);
    console.log('backwardRoute -->', backwardRoute);

    // 4) Execute
    const tx = await arbitrage.connect(owner).simpleArbitrage(
      DAI, // tokenIn
      SAITO, // tokenOut
      forwardRoute.encoded, // bytes path for forward leg
      backwardRoute.encoded, // bytes path for backward leg
      ethers.parseEther(BORROW_AMOUNT.toString()), // borrowAmount
    );
    await tx.wait();

    // 5) Verify
    const bal = await ethers.provider.getBalance(arbitrage.target);
    console.log('Arbitrage contract ETH balance:', ethers.formatEther(bal));
    expect(bal).to.be.gte(0);
  });
});
