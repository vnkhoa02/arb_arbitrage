import { expect } from 'chai';
import { ethers } from 'hardhat';
import type { SimpleArbitrage } from '../../typechain-types';
import { mockRoute } from './mockData/routes';
import { encodeParams } from '../../shared/lib/helpers/encode';

describe.only('SimpleArbitrage Arbitrum', () => {
  const BORROW_AMOUNT = ethers.parseEther('1'); // 1 WETH

  let arbitrage: SimpleArbitrage;
  let owner: any;

  before(async () => {
    [owner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('SimpleArbitrage', owner);
    arbitrage = (await Factory.deploy()) as SimpleArbitrage;
    await arbitrage.waitForDeployment();
  });

  it('simpleArbitrage does not revert with mockRoute', async function () {
    const forwardPaths = mockRoute.forward.route.map((r) => encodeParams(r));
    const backwardPaths = mockRoute.backward.route.map((r) => encodeParams(r));

    const tx = arbitrage
      .connect(owner)
      .simpleArbitrage(
        mockRoute.forward.tokenIn,
        mockRoute.forward.tokenOut,
        forwardPaths,
        backwardPaths,
        BORROW_AMOUNT,
      );
    await expect(tx).to.not.be.reverted;
  });
});
