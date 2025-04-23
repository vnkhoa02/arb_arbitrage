import 'dotenv/config';
import { ethers } from 'ethers';

export const provider = new ethers.InfuraProvider(
  'mainnet',
  process.env.INFURA_API_KEY,
);

export const defaultProvider = ethers.getDefaultProvider('mainnet');
