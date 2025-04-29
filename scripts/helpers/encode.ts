import { AbiCoder, ethers } from 'ethers';
import { Route } from '../types/quote';

// Encodes a path (token addresses and fees) for Uniswap V3 router
export function encodePath(
  amountIn: string,
  tokens: string[],
  fees: number[],
): string {
  if (tokens.length !== fees.length + 1) {
    throw new Error('tokens.length must be fees.length + 1');
  }

  let path = '0x';

  for (let i = 0; i < fees.length; i++) {
    path += tokens[i].slice(2);
    path += ethers.toBeHex(fees[i], 3).slice(2); // fee is uint24 (3 bytes)
  }
  path += tokens[tokens.length - 1].slice(2);

  path = path.toLowerCase();
  const encode = ethers.solidityPacked(['uint256', 'bytes'], [amountIn, path]);
  return encode;
}

export function encodePathsAsBytes(paths: string[]): string[] {
  return paths.map((path) => ethers.hexlify(ethers.toUtf8Bytes(path)));
}

/**
 * Reconstructs the UniswapV3 path bytes (tokenIn + fee + tokenOut) from one hop-array
 */
export function encodeRouteToPath(hops: Route[]): string {
  let path = '0x';
  for (let i = 0; i < hops.length; i++) {
    const hop = hops[i];
    // 20-byte tokenIn
    path += hop.tokenIn.address.toLowerCase().slice(2);
    // 3-byte fee
    path += ethers.zeroPadValue(ethers.toBeHex(BigInt(hop.fee)), 3).slice(2);
    // on last hop, append tokenOut
    if (i === hops.length - 1) {
      path += hop.tokenOut.address.toLowerCase().slice(2);
    }
  }
  return path;
}

/**
 * ABI-encode the tuple (uint256 amountIn, bytes path) exactly as
 * your Solidity `_executeOperation` expects each element.
 */
export function encodeParams(hops: Route[]): string {
  if (!hops[0].amountIn) {
    throw Error('Hop does have amountIn!');
  }
  const amountIn = BigInt(hops[0].amountIn);
  const pathBytes = encodeRouteToPath(hops);
  return AbiCoder.defaultAbiCoder().encode(
    ['uint256', 'bytes'],
    [amountIn, pathBytes],
  );
}
