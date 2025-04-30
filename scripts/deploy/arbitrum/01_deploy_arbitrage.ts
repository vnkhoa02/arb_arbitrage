import { tenderly } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployArbitrageArb: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment,
) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  if (network.name !== 'arbMainnet') {
    console.log('⚠️ Deployment should only run on arbMainnet!');
    return;
  }

  console.log('🔧 Deploying on Arbitrum mainnet...');

  const ArbitrageV2 = await deploy('ArbitrageV2', {
    from: deployer,
    log: true,
    waitConfirmations: 3,
  });

  console.log('✅ 1/2 Deploy success! Address:', ArbitrageV2.address);

  const SimpleArbitrage = await deploy('SimpleArbitrage', {
    from: deployer,
    log: true,
    waitConfirmations: 3,
  });

  console.log('✅ 2/2 Deploy success! Address:', SimpleArbitrage.address);

  console.log('Tenderly verifying');
  await tenderly.verify({
    name: 'ArbitrageV2',
    address: ArbitrageV2.address,
  });
  await tenderly.verify({
    name: 'SimpleArbitrage',
    address: SimpleArbitrage.address,
  });
  console.log('Tenderly verifed');
};

export default deployArbitrageArb;
deployArbitrageArb.tags = ['ArbitrageV2'];
