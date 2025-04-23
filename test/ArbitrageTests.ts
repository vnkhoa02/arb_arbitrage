import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Arbitrage, IERC20 } from '../typechain-types';
import { WETH9 } from '../shared/mainnet_addr';

describe('Arbitrage Tests', () => {
  let Arbitrage: Arbitrage;
  let USDT: IERC20;
  let owner: any;
  let user: any;

  // we’ll borrow/swapping small amounts to keep gas reasonable
  const BORROW_AMOUNT = ethers.parseEther('0.1');

  before(async () => {
    [owner, user] = await ethers.getSigners();
    // Deploy your strategy
    const Factory = await ethers.getContractFactory('Arbitrage', owner);
    Arbitrage = (await Factory.deploy()) as Arbitrage;
    await Arbitrage.waitForDeployment();

    // Get real WETH & USDT on Mainnet
    USDT = (await ethers.getContractAt('IERC20', USDT)) as IERC20;
  });

  it('simpleArbitrage: should not revert & state vars set', async () => {
    // Call simpleArbitrage as owner
    const _lowFee = 3000; // low-fee tier
    const _highFee = 10000; // high-fee tier
    await expect(
      Arbitrage.connect(owner).simpleArbitrage(
        WETH9,
        _lowFee, // low-fee tier
        0, // low-fee pool price (dummy)
        _highFee, // high-fee tier
        0, // high-fee pool price (dummy)
        BORROW_AMOUNT, // borrow 0.1 WETH
      ),
    ).to.not.be.reverted;

    // Confirm state variables were updated
    expect(await Arbitrage.poolFeeLow()).to.equal(_lowFee);
    expect(await Arbitrage.poolFeeLowPrice()).to.equal(0);
    expect(await Arbitrage.poolFeeHigh()).to.equal(_highFee);
    expect(await Arbitrage.poolFeeHighPrice()).to.equal(0);
  });
});
