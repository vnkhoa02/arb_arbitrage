import path from 'path';
import 'dotenv/config';
import 'hardhat-deploy';
import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomicfoundation/hardhat-toolbox';
import '@typechain/hardhat';
import type { HardhatUserConfig } from 'hardhat/config';
import '@tenderly/hardhat-tenderly';

const PRIVATE_KEY = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: '0.8.28',
  paths: {
    deploy: path.join(__dirname, 'scripts/deploy/arbitrum'),
  },
  tenderly: {
    project: 'project',
    username: 'khoacaro96',
    privateVerification: process.env.TENDERLY_PUBLIC_VERIFICATION !== 'true',
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.INFURA_ARBITRUM_MAINNET_URL as string,
        // blockNumber: 331152474,
      },
    },
    tenderly: {
      chainId: 42161,
      url: process.env.TENDERLY_ARBITRUM_TEST_NET_URL as string,
    },
    // mainnet: {
    //   url: process.env.INFURA_MAINNET_URL,
    //   accounts: PRIVATE_KEY,
    //   chainId: 1,
    // },
    arbMainnet: {
      url: process.env.INFURA_ARBITRUM_MAINNET_URL,
      accounts: PRIVATE_KEY,
      chainId: 42161,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0, // first account in `accounts` array
    },
  },
  verify: {
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY,
    },
  },
  mocha: {
    timeout: 100000000,
  },
};

export default config;
