import 'dotenv/config';
import { ArbPath } from '../types';

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
