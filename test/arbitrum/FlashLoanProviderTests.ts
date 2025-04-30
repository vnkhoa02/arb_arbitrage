import { JsonRpcSigner } from '@ethersproject/providers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { WETH } from '../../shared/arbitrum/mainnet_addr';
import { provider } from '../../shared/lib/helpers/provider';
import { FlashLoanProviderMock } from '../../typechain-types';

describe('FlashLoanProvider Arbitrum', function () {
  let mock: FlashLoanProviderMock;
  let owner: JsonRpcSigner;

  before(async function () {
    owner = provider.getSigner();
    const Factory = await ethers.getContractFactory(
      'FlashLoanProviderMock',
      owner,
    );
    mock = (await Factory.deploy()) as FlashLoanProviderMock;
    await mock.deployed();
  });

  it('reverts if receiveFlashLoan is not called by vault', async function () {
    await expect(mock.receiveFlashLoan([], [], [], '0x')).to.be.revertedWith(
      'FlashLoanProvider: Not vault',
    );
  });

  it('prevents non-owner from calling testFlashLoan()', async function () {
    // pick any other signer
    const [_, nonOwner] = await ethers.getSigners();
    await expect(
      mock.connect(nonOwner).testFlashLoan([WETH], [0], '0x'),
    ).to.be.revertedWith('Not owner');
  });

  it('allows the owner to initiate a flash loan via testFlashLoan()', async function () {
    const tokens = [WETH];
    const amounts = [ethers.utils.parseEther('0.05')];
    const ud = '0xdeadbeef';

    await expect(mock.connect(owner).testFlashLoan(tokens, amounts, ud)).to.not
      .be.reverted;
  });
});
