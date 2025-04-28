import path from 'path';
import 'dotenv/config';
import 'hardhat-deploy';
import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import '@typechain/hardhat';
import type { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  solidity: '0.8.28',
  paths: {
    deploy: path.join(__dirname, 'scripts/deploy/arbitrum'),
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.INFURA_ARBITRUM_MAINNET_URL as string,
        // blockNumber: 331152474,
      },
    },
    // mainnet: {
    //   url: process.env.INFURA_MAINNET_URL,
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    //   chainId: 1,
    // },
    arbMainnet: {
      url: process.env.INFURA_ARBITRUM_MAINNET_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 42161,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0, // first account in `accounts` array
    },
  },
  mocha: {
    timeout: 100000000,
  },
};

export default config;
