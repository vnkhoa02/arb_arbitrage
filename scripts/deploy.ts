import { ethers } from 'hardhat';

async function main() {
  const FlashSwap = await ethers.getContractFactory('FlashSwap');
  console.log('Deploying FlashSwap...');

  const flashSwap = await FlashSwap.deploy();
  await flashSwap.waitForDeployment();
  const address = await flashSwap.getAddress();
  console.log('FlashSwap deployed to:', address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
