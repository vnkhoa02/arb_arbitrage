import { expect } from 'chai';
import { ethers } from 'hardhat';
import { encodeParams } from '../../shared/lib/helpers/encode';
import {
  EthersOnTenderlyFork,
  forkForTest,
} from '../../shared/lib/tenderly/fork';
import type { EtherSimpleArbitrage } from '../../typechain-types';
import { mockRoute } from './mockData/routes';

describe('EtherSimpleArbitrage Mainnet', () => {
  const BORROW_AMOUNT = ethers.utils.parseEther('1'); // 1 WETH

  let mock: EtherSimpleArbitrage;
  let owner: any;
  let fork: EthersOnTenderlyFork;

  before(async () => {
    fork = await forkForTest({
      network_id: '1',
    });
    owner = fork.provider.getSigner();
    const Factory = await ethers.getContractFactory(
      'EtherSimpleArbitrage',
      owner,
    );
    mock = await Factory.deploy();
    mock = await ethers.getContractAt('EtherSimpleArbitrage', mock.address);
  });

  // after(async () => {
  //   if (fork) await fork.removeFork();
  // });

  it('simpleArbitrage does not revert with mockRoute', async function () {
    const forwardPaths = mockRoute.forward.route.map((r) => encodeParams(r));
    const backwardPaths = mockRoute.backward.route.map((r) => encodeParams(r));
    const tx = mock
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
