import 'dotenv/config';

import { BigNumber, utils } from 'ethers';
import { ArbPath } from '../../types';
import { Route } from '../../types/quote';

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
  const url = `${scannerUrl}/scanner/arbitrage?amountIn=${amountIn}&tokenIn=${tokenIn}&tokenOut=${tokenOut}`;
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
  const pathBytes: string[] = [];

  for (let i = 0; i < route.length; i++) {
    const hop = route[i];

    // TokenIn address (20 bytes)
    const tokenIn = utils.getAddress(hop.tokenIn.address);
    pathBytes.push(tokenIn.toLowerCase());

    // Fee: convert to 3-byte hex (padded left)
    const feeHex = utils.hexZeroPad(BigNumber.from(hop.fee).toHexString(), 3);
    pathBytes.push(feeHex);

    // TokenOut only at the end
    if (i === route.length - 1) {
      const tokenOut = utils.getAddress(hop.tokenOut.address);
      pathBytes.push(tokenOut.toLowerCase());
    }
  }

  const concatenated =
    '0x' + pathBytes.map((b) => b.replace(/^0x/, '')).join('');
  return concatenated;
}
