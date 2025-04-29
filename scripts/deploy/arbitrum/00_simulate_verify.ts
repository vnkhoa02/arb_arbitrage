import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

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

  console.log('🔧 Simulating deployment on forked mainnet...');
  const ArbitrageV2 = await deploy('ArbitrageV2', {
    from: deployer,
    log: true,
  });

  console.log('✅ 1/2 Simulated deploy success! Address:', ArbitrageV2.address);

  const SimpleArbitrage = await deploy('SimpleArbitrage', {
    from: deployer,
    log: true,
  });

  console.log(
    '✅ 2/2 Simulated deploy success! Address:',
    SimpleArbitrage.address,
  );
};

export default simulateDeploy;
simulateDeploy.tags = ['Simulate'];
