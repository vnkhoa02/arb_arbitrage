export interface ArbPath {
  forward: ArbPathResult;
  backward: ArbPathResult;
  roundTrip: ArbRoundTrip;
}

export interface ArbPathResult {
  fee: number;
  price: number | string;
  tokenIn: string;
  amountIn: number | string;
  tokenOut: string;
  amountOut: number | string;
}

export interface ArbRoundTrip {
  profit: number | string;
  isProfitable: boolean;
}
