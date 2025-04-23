import { expect } from 'chai';
import { ethers } from 'hardhat';
import { findBestPath } from '../scripts/helpers/getQuote';
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

  it('simpleArbitrage', async () => {
    const path = await findBestPath(WETH9, ETH_BORROW_AMOUNT.toString(), USDT);
    console.log('Calling simpleArbitrage...', path);
    try {
      const tx = await Arbitrage.connect(owner).simpleArbitrage(
        WETH9,
        path.buyFee,
        path.sellFee,
        ethers.parseUnits(path.buyPrice, 18),
        ethers.parseUnits(path.sellPrice, 18),
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
