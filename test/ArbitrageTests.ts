import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Arbitrage } from '../typechain-types';
import { WETH9 } from '../shared/mainnet_addr';

describe('Arbitrage Tests', () => {
  let Arbitrage: Arbitrage;
  let owner: any;

  const BORROW_AMOUNT = ethers.parseEther('1'); // 1 WETH

  before(async () => {
    [owner] = await ethers.getSigners();
    console.log('Deploying Arbitrage contract...');
    const Factory = await ethers.getContractFactory('Arbitrage', owner);
    Arbitrage = (await Factory.deploy()) as Arbitrage;
    await Arbitrage.waitForDeployment();
    console.log('Arbitrage deployed to:', Arbitrage.target);
  });

  it('simpleArbitrage: should not revert & state vars set', async () => {
    // Call simpleArbitrage as owner
    const _lowFee = 500; // low-fee tier
    const _lowFeePrice = ethers.parseUnits('17787.440663', 18); // low-fee pool price (dummy)
    const _highFee = 3000; // high-fee tier
    const _highFeePrice = ethers.parseUnits('17707.246451', 18); // high-fee pool price (dummy)
    console.log('Calling simpleArbitrage...');
    const tx = await Arbitrage.connect(owner).simpleArbitrage(
      WETH9,
      _lowFee,
      _highFee,
      _lowFeePrice,
      _highFeePrice,
      BORROW_AMOUNT,
    );
    await tx.wait();
    console.log('simpleArbitrage tx:', tx);
    // Wait for transaction to be mined
    expect(tx).to.not.be.reverted;
  });
});
