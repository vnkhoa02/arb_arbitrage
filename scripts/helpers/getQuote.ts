import axios from 'axios';
import { ethers, toBigInt } from 'ethers';
import { UNISWAP_QUOTER } from '../../shared/mainnet_addr';
import { ArbPath } from '../types';
import { provider } from './provider';

/**
 * Get a quote for a token swap using the Uniswap Quoter contract.
 * @param tokenIn The address of the input token.
 * @param tokenOut The address of the output token.
 * @param amountIn The amount of the input token.
 * @param fee The fee tier of the Uniswap pool (e.g., 500, 3000, 10000).
 * @param decimalOut The number of decimals for the output token (default is 6).
 * @returns The quoted amount of the output token.
 */
export async function getQuote(
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  feeAmount: string | number,
  decimalOut = 6,
) {
  try {
    const quoterABI = [
      'function quoteExactInputSingle(address,address,uint24,uint256,uint160) view returns (uint256)',
    ];
    const quoter = new ethers.Contract(UNISWAP_QUOTER, quoterABI, provider);
    const amountInBigInt = ethers.parseUnits(amountIn, 18);
    const sqrtPriceLimitX96 = 0;

    const quotedAmount = await quoter.quoteExactInputSingle(
      tokenIn,
      tokenOut,
      toBigInt(feeAmount),
      amountInBigInt,
      sqrtPriceLimitX96,
    );
    return ethers.formatUnits(quotedAmount, decimalOut);
  } catch (error) {
    console.error('Error getting quote:', error);
    throw error;
  }
}
/**
 *  Find the best arbitrage path for a given token and amount.
 * @param token The address of the token to swap.
 * @param amountIn The amount of input token to swap.
 * @param tokenOut The address of the output token.
 * @returns
 */
export async function findBestPath(
  tokenIn: string,
  amountIn: string,
  tokenOut: string,
) {
  const url = `http://localhost:3000/dex/arbitrage?amountIn=${amountIn}&tokenIn=${tokenIn}&tokenOut=${tokenOut}`;
  console.log('Fetching path from:', url);
  const path = axios.get<ArbPath>(url);
  const { data } = await path;
  return data;
}
