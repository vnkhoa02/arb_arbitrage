import 'dotenv/config';
import '@nomicfoundation/hardhat-ethers';
import type { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  solidity: '0.8.28',
  defaultNetwork: 'sepolia',
  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.INFURA_SEPOLIA_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

export default config;
