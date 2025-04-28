// utils/encodePath.ts
import { ethers } from 'ethers';

// Encodes a path (token addresses and fees) for Uniswap V3 router
export function encodePath(tokens: string[], fees: number[]): string {
  if (tokens.length !== fees.length + 1) {
    throw new Error('tokens.length must be fees.length + 1');
  }

  let path = '0x';

  for (let i = 0; i < fees.length; i++) {
    path += tokens[i].slice(2);
    path += ethers.toBeHex(fees[i], 3).slice(2); // fee is uint24 (3 bytes)
  }
  path += tokens[tokens.length - 1].slice(2);

  return path.toLowerCase();
}
