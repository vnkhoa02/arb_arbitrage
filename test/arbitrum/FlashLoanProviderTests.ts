import { expect } from 'chai';
import { ethers } from 'hardhat';
import { WETH } from '../../shared/arbitrum/mainnet_addr';
import { FlashLoanProviderMock } from '../../typechain-types';

describe('FlashLoanProvider Arbitrum', function () {
  let mock: FlashLoanProviderMock;
  let owner: Awaited<ReturnType<typeof ethers.getSigner>>;

  before(async function () {
    [owner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory(
      'FlashLoanProviderMock',
      owner,
    );
    mock = (await Factory.deploy()) as FlashLoanProviderMock;
    await mock.waitForDeployment();
  });

  it('reverts if receiveFlashLoan is not called by vault', async function () {
    await expect(mock.receiveFlashLoan([], [], [], '0x')).to.be.revertedWith(
      'FlashLoanProvider: Not vault',
    );
  });

  it('prevents non-owner from calling testFlashLoan()', async function () {
    // pick any other signer
    const nonOwner = (await ethers.getSigners())[1];
    await expect(
      mock.connect(nonOwner).testFlashLoan([WETH], [0], '0x'),
    ).to.be.revertedWith('Not owner');
  });

  it('allows the owner to initiate a flash loan via testFlashLoan()', async function () {
    const tokens = [WETH];
    const amounts = [ethers.parseEther('0.05')];
    const ud = '0xdeadbeef';

    await expect(mock.connect(owner).testFlashLoan(tokens, amounts, ud)).to.not
      .be.reverted;
  });
});
