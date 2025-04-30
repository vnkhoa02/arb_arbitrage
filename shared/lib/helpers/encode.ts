import { BigNumber, ethers } from 'ethers';
import { Route } from '../../types/quote';

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
    path += ethers.utils
      .hexZeroPad(BigNumber.from(hop.fee).toHexString(), 3)
      .slice(2);
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
  const amountOutMinimum = 0;
  return ethers.utils.defaultAbiCoder.encode(
    ['uint256', 'uint256', 'bytes'],
    [amountIn, amountOutMinimum, pathBytes],
  );
}
