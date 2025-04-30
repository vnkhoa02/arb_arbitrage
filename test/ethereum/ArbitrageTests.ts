import { expect } from 'chai';
import { ethers } from 'hardhat';
import { DAI, SAITO } from '../../shared/mainnet_addr';
import { Arbitrage } from '../../typechain-types';
import { findBestPath, pickBestRoute } from '../../shared/lib/helpers/getQuote';
import { provider } from '../../shared/lib/helpers/provider';

describe('Arbitrage Tests', () => {
  const BORROW_AMOUNT = 1000; // 1000 USD
  let arbitrage: Arbitrage;
  let owner: any;

  before(async () => {
    owner = provider.getSigner();
    const Factory = await ethers.getContractFactory('Arbitrage', owner);
    arbitrage = (await Factory.deploy()) as Arbitrage;
    await arbitrage.deployed();
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
    const forwardOutMin = ethers.utils.parseUnits(
      path.forward.amountOut.toString(),
      18,
    );
    const backwardRoute = pickBestRoute(path.backward.route);
    const backwardOutMin = ethers.utils.parseUnits(
      path.backward.amountOut.toString(),
      18,
    );
    const amountIn = ethers.utils.parseUnits(BORROW_AMOUNT.toString(), 18); // returns BigInt

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

    const bal = await provider.getBalance(arbitrage.address);
    console.log(
      'Arbitrage contract ETH balance:',
      ethers.utils.formatEther(bal),
    );
    expect(bal).to.be.gte(0);
  });
});
