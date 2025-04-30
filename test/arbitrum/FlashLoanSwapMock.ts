import { expect } from 'chai';
import { ethers } from 'hardhat';

import { USDT, WETH } from '../../shared/arbitrum/mainnet_addr';
import { encodeParams } from '../../shared/lib/helpers/encode';
import {
  EthersOnTenderlyFork,
  forkForTest,
} from '../../shared/lib/tenderly/fork';
import { FlashLoanSwapMock } from '../../typechain-types';
import { mockRoute } from './mockData/routes';

describe.only('FlashLoanSwapMock', () => {
  const BORROW_AMOUNT = ethers.utils.parseEther('1'); // 1 WETH (assuming decimals=18)

  let mock: FlashLoanSwapMock;
  let owner: any;
  let fork: EthersOnTenderlyFork;

  before(async () => {
    fork = await forkForTest({
      network_id: '42161',
    });
    owner = fork.provider.getSigner();
    const Factory = await ethers.getContractFactory('FlashLoanSwapMock', owner);
    const tx = await Factory.deploy();
    console.log('waitForDeployment');
    await tx.waitForDeployment();
    mock = await ethers.getContractAt('FlashLoanSwapMock', tx.address);
    console.log('FlashLoanSwapMock deployed at', mock.address);
    const IWETH = await ethers.getContractAt('IWETH', WETH);
    await IWETH.connect(owner).deposit({
      value: ethers.utils.parseEther('10'),
    });
    await IWETH.connect(owner).transfer(
      mock.address,
      ethers.utils.parseEther('10'),
    );
  });

  it('flashLoanAndSwap', async function () {
    const forwardPaths = mockRoute.forward.route.map((r) => encodeParams(r));
    const response = await mock
      .connect(owner)
      .flashLoanAndSwap(forwardPaths, WETH, USDT, BORROW_AMOUNT);
    const tx = await response.getTransaction();
    expect(tx).to.not.be.null;
    const receipt = await tx?.wait();
    expect(receipt).to.not.be.null;
    expect(receipt?.status).to.equal(1);
    expect(tx).to.not.be.reverted;
  });

  it('withdraw', async function () {
    const usdt = await ethers.getContractAt('IWETH', USDT);
    const contractAddress = usdt.address;
    console.log('usdt addr ->', contractAddress);
    const ownerAddress = await owner.address;
    console.log('ownerAddress ->', contractAddress);
    // Get balance before withdrawal
    const balanceBefore = await usdt.balanceOf(ownerAddress);
    console.log('balanceBefore', balanceBefore);
    const contractBalance = await usdt.balanceOf(contractAddress);
    console.log('contractBalance', contractBalance);
    const response = await mock.connect(owner).withdrawToken(USDT);
    const tx = await response.getTransaction();
    expect(tx).to.not.be.null;
    const receipt = await tx?.wait();
    expect(receipt).to.not.be.null;
    expect(receipt?.status).to.equal(1);
    // Withdraw USDT from contract
    expect(tx).to.not.be.reverted;

    // Check that owner's USDT balance increased by contract's balance
    const balanceAfter = await usdt.balanceOf(ownerAddress);
    console.log('balanceAfter', balanceAfter);
    expect(balanceAfter).to.equal(balanceBefore + contractBalance);
  });
});
