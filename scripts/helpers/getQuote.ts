import 'dotenv/config';
import { getAddress, zeroPadValue, concat, getBytes } from 'ethers';
import { ArbPath } from '../types';
import { Route } from '../types/quote';

const scannerUrl = process.env.ARB_SCANNER_URL || 'http://localhost:3000';

/**
 *  Find the best arbitrage path for a given token and amount.
 * @param token The address of the token to swap.
 * @param amountIn The amount of input token to swap.
 * @param tokenOut The address of the output token.
 * @returns
 */
export async function findBestPath(
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
) {
  const url = `${scannerUrl}/dex/arbitrage?amountIn=${amountIn}&tokenIn=${tokenIn}&tokenOut=${tokenOut}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch arbitrage path: ${response.statusText}`);
  }
  const data: ArbPath = await response.json();
  return data;
}

export function pickBestRoute(routes: Route[][]): {
  route: Route[];
  encoded: string;
} {
  const best = routes.reduce((best, current) => {
    const currentOut = Number(current.at(-1)?.amountOut ?? 0);
    const bestOut = Number(best.at(-1)?.amountOut ?? 0);
    return currentOut > bestOut ? current : best;
  }, routes[0]);

  const encoded = encodeRouteToPath(best);
  return { route: best, encoded };
}

function encodeRouteToPath(route: Route[]): string {
  const pathBytes: Uint8Array<ArrayBufferLike>[] = [];

  for (let i = 0; i < route.length; i++) {
    const hop = route[i];

    // TokenIn: address -> 20 bytes
    const tokenInBytes = getBytes(getAddress(hop.tokenIn.address));
    pathBytes.push(getBytes(zeroPadValue(tokenInBytes, 20)));

    // Fee: number/string -> bigint -> 3 bytes
    const feeBigInt = getBytes(hop.fee);
    const feeBytes = getBytes(zeroPadValue(feeBigInt, 3));
    pathBytes.push(feeBytes);

    // TokenOut: only on last hop
    if (i === route.length - 1) {
      const tokenOutBytes = getBytes(getAddress(hop.tokenOut.address));
      pathBytes.push(getBytes(zeroPadValue(tokenOutBytes, 20)));
    }
  }

  return concat(pathBytes); // Returns hex string (e.g., '0x...')
}
