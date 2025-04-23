import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { BALANCER_VAULT, WETH9 } from '../shared/mainnet_addr';
import type { FlashLoanProviderMock } from '../typechain-types';

describe('FlashLoanProvider Tests', function () {
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

    // 2) Impersonate the Balancer Vault account
    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [BALANCER_VAULT],
    });
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
      mock.connect(nonOwner).testFlashLoan([WETH9], [0], '0x'),
    ).to.be.revertedWith('Not owner');
  });

  it('allows the owner to initiate a flash loan via testFlashLoan()', async function () {
    const tokens = [WETH9];
    const amounts = [ethers.parseEther('0.05')];
    const ud = '0xdeadbeef';

    await expect(mock.connect(owner).testFlashLoan(tokens, amounts, ud)).to.not
      .be.reverted;
  });

  it('reverts when loan is not repaid in full', async function () {
    const tokens = [WETH9];
    const amounts = [ethers.parseEther('0.05')];
    const ud = '0xdeadbeef';

    // Tell the mock to underpay on purpose
    await mock.connect(owner).setSimulateDefault(false);

    expect(mock.connect(owner).testFlashLoan(tokens, amounts, ud)).to.be
      .reverted;
  });
});
