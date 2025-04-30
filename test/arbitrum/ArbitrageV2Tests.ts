import { expect } from 'chai';
import { ethers } from 'hardhat';

import { USDT, WETH } from '../../shared/arbitrum/mainnet_addr';
import { ArbitrageV2 } from '../../typechain-types';
import { mockRoute } from './mockData/routes';
import { encodeParams } from '../../shared/lib/helpers/encode';
import { provider } from '../../shared/lib/helpers/provider';

describe('ArbitrageV2 Arbitrum', () => {
  const BORROW_AMOUNT = ethers.utils.parseEther('1'); // 1 WETH (assuming decimals=18)

  let arbitrage: ArbitrageV2;
  let owner: any;

  before(async () => {
    owner = provider.getSigner();
    const Factory = await ethers.getContractFactory('ArbitrageV2', owner);
    arbitrage = (await Factory.deploy()) as ArbitrageV2;
    await arbitrage.waitForDeployment();
  });

  it('arbitrageDexes', async function () {
    const forwardPaths = mockRoute.forward.route.map((r) => encodeParams(r));

    const tx = arbitrage
      .connect(owner)
      .arbitrageDexes(forwardPaths, WETH, USDT, BORROW_AMOUNT);

    await expect(tx).to.not.be.reverted;
  });
});
