import 'dotenv/config';
import { ethers } from 'ethers';

export const provider = new ethers.JsonRpcProvider(
  process.env.INFURA_MAINNET_URL,
);

export const defaultProvider = ethers.getDefaultProvider('mainnet');
