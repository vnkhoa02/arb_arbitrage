import { expect } from 'chai';
import { ethers } from 'hardhat';

import { encodePath } from '../../scripts/helpers/encode';
import { USDC, WETH } from '../../shared/arbitrum/mainnet_addr';
import { ArbitrageV2 } from '../../typechain-types';

describe('ArbitrageV2 Arbitrum', () => {
  const BORROW_AMOUNT = ethers.parseEther('1'); // 1 WETH (assuming decimals=18)

  let arbitrage: ArbitrageV2;
  let owner: any;

  before(async () => {
    [owner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('ArbitrageV2', owner);
    arbitrage = (await Factory.deploy()) as ArbitrageV2;
    await arbitrage.waitForDeployment();
  });

  it('arbitrageDexes', async function () {
    // Encode path (WETH -> USDC with 0.05% fee tier)
    const path = encodePath([WETH, USDC], [500]);

    const tx = arbitrage
      .connect(owner)
      .arbitrageDexes(path, WETH, USDC, BORROW_AMOUNT);

    await expect(tx).to.not.be.reverted;
  });
});
