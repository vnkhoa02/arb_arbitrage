import { ethers } from 'ethers';
const RPC_URL = process.env.VIRTUAL_MAINNET_RPC_URL || '';

export const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
