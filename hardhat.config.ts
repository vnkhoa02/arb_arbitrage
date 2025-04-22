import 'dotenv/config';
import '@nomicfoundation/hardhat-ethers';
import '@typechain/hardhat';
import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import type { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  solidity: '0.8.28',
  networks: {
    hardhat: {
      forking: {
        url: process.env.INFURA_MAINNET_URL as string,
        blockNumber: 22323681,
      },
    },
    sepolia: {
      url: process.env.INFURA_SEPOLIA_URL,
      accounts: [],
    },
    arbitrum: {
      url: process.env.INFURA_ARB_MAINNET_URL,
      accounts: [],
    },
  },
};

export default config;
