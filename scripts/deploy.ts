import { ethers } from 'hardhat';

async function main() {
  const FlashSwap = await ethers.getContractFactory('FlashSwap');
  console.log('Deploying FlashSwap...');

  const flashSwap = await FlashSwap.deploy();
  await flashSwap.ƒdeployed();

  console.log('FlashSwap deployed to:', flashSwap.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
