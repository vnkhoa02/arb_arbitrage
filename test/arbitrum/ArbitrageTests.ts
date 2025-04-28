import { expect } from 'chai';
import { ethers } from 'hardhat';

import { encodePath } from '../../scripts/helpers/encode';
import { USDC, WETH } from '../../shared/arbitrum/mainnet_addr';
import { ArbitrageV2Mock } from '../../typechain-types';

describe('ArbitrageV2Mock', () => {
  const BORROW_AMOUNT = ethers.parseEther('1'); // 1 WETH (assuming decimals=18)

  let arbitrage: ArbitrageV2Mock;
  let owner: any;

  before(async () => {
    [owner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('ArbitrageV2Mock', owner);
    arbitrage = (await Factory.deploy()) as ArbitrageV2Mock;
    await arbitrage.waitForDeployment();
    const address = await arbitrage.getAddress();
    const IWETH = await ethers.getContractAt('IWETH', WETH);
    await IWETH.connect(owner).deposit({
      value: ethers.parseEther('10'),
    });
    await IWETH.connect(owner).transfer(address, ethers.parseEther('10'));
  });

  it('flashLoanAndSwap', async function () {
    // Encode path (WETH -> USDC with 0.05% fee tier)
    const path = encodePath([WETH, USDC], [500]);

    // Call the flashLoanAndSwap
    await expect(
      arbitrage.connect(owner).flashLoanAndSwap(
        WETH,
        USDC,
        path,
        BORROW_AMOUNT,
        0, // Accept any amount out (for test purpose; in prod you set minAmountOut)
      ),
    ).to.not.be.reverted;
  });
});
