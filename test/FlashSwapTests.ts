import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import { FlashSwap, IERC20, IWETH } from '../typechain-types';

const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const WETH9 = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

describe('FlashSwap Tests', () => {
  let flashSwap: FlashSwap;
  let signer: Signer;
  let weth: IWETH;
  let dai: IERC20;

  before(async () => {
    const [deployer] = await ethers.getSigners();
    signer = deployer;

    const flashSwapFactory = await ethers.getContractFactory('FlashSwap');
    flashSwap = await flashSwapFactory.deploy();
    await flashSwap.waitForDeployment();

    weth = (await ethers.getContractAt('IWETH', WETH9)) as IWETH;
    dai = (await ethers.getContractAt('IERC20', DAI)) as IERC20;
  });

  it('swapExactInputSingle', async () => {
    const amountIn = ethers.parseEther('0.1'); // 1 WETH

    await weth.deposit({ value: amountIn });
    const address = await flashSwap.getAddress();
    await weth.approve(address, amountIn);

    await flashSwap.swapExactInputSingle(amountIn);

    const balance = await dai.balanceOf(await signer.getAddress());
    console.log('DAI balance after swapExactInputSingle:', balance.toString());
  });

  // it('swapExactOutputSingle', async () => {
  //   const wethAmountInMax = ethers.utils.parseEther('1');
  //   const daiAmountOut = ethers.utils.parseUnits('100', 18);

  //   await weth.deposit({ value: wethAmountInMax });
  //   await weth.approve(flashSwap.address, wethAmountInMax);

  //   await flashSwap.swapExactOutputSingle(daiAmountOut, wethAmountInMax);

  //   const balance = await dai.balanceOf(await signer.getAddress());
  //   console.log('DAI balance after swapExactOutputSingle:', balance.toString());
  // });

  // it('swapExactInputMultihop', async () => {
  //   const amountIn = ethers.utils.parseEther('1');

  //   await weth.deposit({ value: amountIn });
  //   await weth.approve(flashSwap.address, amountIn);

  //   await flashSwap.swapExactInputMultihop(amountIn);

  //   const balance = await dai.balanceOf(await signer.getAddress());
  //   console.log(
  //     'DAI balance after swapExactInputMultihop:',
  //     balance.toString(),
  //   );
  // });

  // it('swapExactOutputMultihop', async () => {
  //   const wethAmountInMax = ethers.utils.parseEther('1');
  //   const daiAmountOut = ethers.utils.parseUnits('100', 18);

  //   await weth.deposit({ value: wethAmountInMax });
  //   await weth.approve(flashSwap.address, wethAmountInMax);

  //   await flashSwap.swapExactOutputMultihop(daiAmountOut, wethAmountInMax);

  //   const balance = await dai.balanceOf(await signer.getAddress());
  //   console.log(
  //     'DAI balance after swapExactOutputMultihop:',
  //     balance.toString(),
  //   );
  // });
});
