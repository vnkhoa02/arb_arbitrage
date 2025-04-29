import { expect } from 'chai';
import { ethers } from 'hardhat';

import { encodeParams } from '../../scripts/helpers/encode';
import { USDT, WETH } from '../../shared/arbitrum/mainnet_addr';
import { FlashLoanSwapMock } from '../../typechain-types';
import { mockRoute } from './mockData/routes';

describe('FlashLoanSwapMock', () => {
  const BORROW_AMOUNT = ethers.parseEther('1'); // 1 WETH (assuming decimals=18)

  let arbitrage: FlashLoanSwapMock;
  let owner: any;

  before(async () => {
    [owner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('FlashLoanSwapMock', owner);
    arbitrage = (await Factory.deploy()) as FlashLoanSwapMock;
    await arbitrage.waitForDeployment();
    const address = await arbitrage.getAddress();
    const IWETH = await ethers.getContractAt('IWETH', WETH);
    await IWETH.connect(owner).deposit({
      value: ethers.parseEther('10'),
    });
    await IWETH.connect(owner).transfer(address, ethers.parseEther('10'));
  });

  it('flashLoanAndSwap', async function () {
    const forwardPaths = mockRoute.forward.route.map((r) => encodeParams(r));
    await expect(
      arbitrage
        .connect(owner)
        .flashLoanAndSwap(forwardPaths, WETH, USDT, BORROW_AMOUNT),
    ).to.not.be.reverted;
  });

  it('withdraw', async function () {
    const usdt = await ethers.getContractAt(
      '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
      USDT,
    );
    const contractAddress = await arbitrage.getAddress();

    // Get balance before withdrawal
    const balanceBefore = await usdt.balanceOf(owner.address);
    console.log('balanceBefore', balanceBefore);
    const contractBalance = await usdt.balanceOf(contractAddress);
    console.log('contractBalance', contractBalance);

    // Withdraw USDT from contract
    await expect(arbitrage.connect(owner).withdrawToken(USDT)).to.not.be
      .reverted;

    // Check that owner's USDT balance increased by contract's balance
    const balanceAfter = await usdt.balanceOf(owner.address);
    console.log('balanceAfter', balanceAfter);
    expect(balanceAfter).to.equal(balanceBefore + contractBalance);
  });
});
