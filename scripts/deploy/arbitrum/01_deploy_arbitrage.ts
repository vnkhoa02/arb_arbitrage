import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployArbitrageArb: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment,
) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

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
};

export default deployArbitrageArb;
deployArbitrageArb.tags = ['ArbitrageV2'];
