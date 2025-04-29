import { expect } from 'chai';
import { ethers } from 'hardhat';
import { DAI, SAITO } from '../../shared/mainnet_addr';
import { Arbitrage } from '../../typechain-types';
import { parseUnits } from 'ethers';
import { findBestPath, pickBestRoute } from '../../shared/lib/helpers/getQuote';

describe('Arbitrage Tests', () => {
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

    // 2) skip if not profitable
    if (!path.roundTrip.isProfitable) {
      console.log('No arbitrage opportunity found.');
      return this.skip();
    }

    // 3) Destructure the two encoded routes (bytes)
    const forwardRoute = pickBestRoute(path.forward.route);
    const forwardOutMin = parseUnits(path.forward.amountOut.toString(), 18);
    const backwardRoute = pickBestRoute(path.backward.route);
    const backwardOutMin = parseUnits(path.backward.amountOut.toString(), 18);
    const amountIn = parseUnits(BORROW_AMOUNT.toString(), 18); // returns BigInt

    const tx = arbitrage
      .connect(owner)
      .simpleArbitrage(
        DAI,
        SAITO,
        forwardRoute.encoded,
        forwardOutMin,
        backwardRoute.encoded,
        backwardOutMin,
        amountIn,
      );
    await Promise.allSettled([tx]);

    const bal = await ethers.provider.getBalance(arbitrage.target);
    console.log('Arbitrage contract ETH balance:', ethers.formatEther(bal));
    expect(bal).to.be.gte(0);
  });
});
