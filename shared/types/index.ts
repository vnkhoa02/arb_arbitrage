import { Route } from './quote';

export interface ArbPath {
  forward: ArbPathResult;
  backward: ArbPathResult;
  roundTrip: ArbRoundTrip;
}

export interface ArbPathResult {
  value: number | string; // Value in USD not USDT or stable coin
  tokenIn: string;
  amountIn: number | string;
  tokenOut: string;
  amountOut: number | string;
  route: Route[][];
}

export interface ArbRoundTrip {
  profit: number | string;
  isProfitable: boolean;
  route: Route[][];
}

export interface IToken {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

export interface ITokenInfo {
  name: string;
  symbol: string;
  decimals: string;
}
