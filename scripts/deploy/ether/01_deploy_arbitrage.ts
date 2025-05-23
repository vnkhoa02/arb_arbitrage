import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployArbitrage: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment,
) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log('Deploying EtherSimpleArbitrage...');

  const result = await deploy('EtherSimpleArbitrage', {
    from: deployer,
    log: true,
    waitConfirmations: 3,
  });

  console.log('EtherSimpleArbitrage deployed to:', result.address);
};

export default deployArbitrage;
deployArbitrage.tags = ['Arbitrage'];
