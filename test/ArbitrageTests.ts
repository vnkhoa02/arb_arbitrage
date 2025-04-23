import { expect } from 'chai';
import { ethers } from 'hardhat';
import { findBestPath } from '../scripts/helpers/getQuote';
import { USDT, WETH9 } from '../shared/mainnet_addr';
import { Arbitrage } from '../typechain-types';

describe.only('Arbitrage Tests', () => {
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

  it('simpleArbitrage', async function () {
    const path = await findBestPath(WETH9, ETH_BORROW_AMOUNT.toString(), USDT);
    console.log('Arbitrage Path Info:', path);

    const forward = path.forward;

    if (!path.roundTrip.isProfitable) {
      console.log('No arbitrage opportunity found.');
      return this.skip();
    }

    const tx = await Arbitrage.connect(owner).simpleArbitrage(
      WETH9,
      USDT,
      forward.buyFee,
      forward.sellFee,
      ethers.parseUnits(String(forward.buyPrice), 18),
      ethers.parseUnits(String(forward.sellPrice), 18),
      ethers.parseEther(ETH_BORROW_AMOUNT.toString()),
    );
    await tx.wait();

    const balance = await ethers.provider.getBalance(Arbitrage.target);
    console.log('Arbitrage contract balance:', ethers.formatEther(balance));
    expect(balance).to.be.gte(0);
  });
});
