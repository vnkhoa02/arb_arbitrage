import 'dotenv/config';
import 'hardhat-deploy';
import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import '@typechain/hardhat';
import type { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  solidity: '0.8.28',
  networks: {
    hardhat: {
      forking: {
        url: process.env.INFURA_MAINNET_URL as string,
      },
    },
    sepolia: {
      url: process.env.INFURA_SEPOLIA_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
    mainnet: {
      url: process.env.INFURA_MAINNET_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1,
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
