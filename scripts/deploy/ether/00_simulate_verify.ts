import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const simulateDeploy: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment,
) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  if (network.name !== 'hardhat') {
    console.log('⚠️ Simulation should only run on hardhat fork!');
    return;
  }

  console.log('🔧 Simulating Arbitrage deployment on forked mainnet...');
  const result = await deploy('Arbitrage', {
    from: deployer,
    log: true,
  });

  console.log('✅ Simulated deploy success! Address:', result.address);
};

export default simulateDeploy;
simulateDeploy.tags = ['Simulate'];
