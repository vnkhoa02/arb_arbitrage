import { JsonRpcProvider } from 'ethers';
const RPC_URL = process.env.VIRTUAL_MAINNET_RPC_URL || '';

export const provider = new JsonRpcProvider(RPC_URL);
