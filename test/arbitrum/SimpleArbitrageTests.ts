import { expect } from 'chai';
import { ethers } from 'hardhat';
import { encodePath } from '../../scripts/helpers/encode';
import { USDC, WETH } from '../../shared/arbitrum/mainnet_addr';
import { SimpleArbitrage } from '../../typechain-types';

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

  it('simpleArbitrage', async function () {
    // Example forward path: WETH -> USDC (0.05% fee)
    const forwardPath = encodePath([WETH, USDC], [500]);

    // Example backward path: USDC -> WETH (0.05% fee)
    const backwardPath = encodePath([USDC, WETH], [500]);

    const tx = arbitrage.connect(owner).simpleArbitrage(
      WETH,
      USDC,
      [
        ethers.solidityPacked(
          ['uint256', 'bytes'],
          [BORROW_AMOUNT, forwardPath],
        ),
      ], // forwardPaths[]
      [
        ethers.solidityPacked(
          ['uint256', 'bytes'],
          [BORROW_AMOUNT, backwardPath],
        ),
      ], // backwardPaths[]
      BORROW_AMOUNT,
    );

    await expect(tx).to.not.be.reverted;
  });
});
