import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployArbitrage: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment,
) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log('Deploying Arbitrage...');

  const result = await deploy('Arbitrage', {
    from: deployer,
    log: true,
    waitConfirmations: 3,
  });

  console.log('Arbitrage deployed to:', result.address);
};

export default deployArbitrage;
deployArbitrage.tags = ['Arbitrage'];
