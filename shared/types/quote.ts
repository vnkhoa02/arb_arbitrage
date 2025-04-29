export interface IUniQuoteResponse {
  requestId: string;
  routing: string;
  quote: Quote;
  permitData: PermitData;
}

export interface Quote {
  chainId: number;
  input: Input;
  output: Output;
  swapper: string;
  route: Route[][];
  slippage: number;
  tradeType: string;
  quoteId: string;
  gasFeeUSD: string;
  gasFeeQuote: string;
  gasUseEstimate: string;
  priceImpact: number;
  txFailureReasons: any[];
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
  gasFee: string;
  gasEstimates: GasEstimate[];
  routeString: string;
  blockNumber: string;
  aggregatedOutputs: AggregatedOutput[];
  portionAmount: string;
  portionBips: number;
  portionRecipient: string;
}

export interface Input {
  amount: string;
  token: string;
}

export interface Output {
  amount: string;
  token: string;
  recipient: string;
}

export interface Route {
  type: string;
  address: string;
  tokenIn: TokenIn;
  tokenOut: TokenOut;
  fee: string;
  liquidity?: string;
  sqrtRatioX96?: string;
  tickCurrent?: string;
  amountIn?: string;
  amountOut?: string;
}

export interface TokenIn {
  chainId: number;
  decimals: string;
  address: string;
  symbol?: string;
}

export interface TokenOut {
  chainId: number;
  decimals: string;
  address: string;
  symbol?: string;
}

export interface GasEstimate {
  type: string;
  strategy: Strategy;
  gasLimit: string;
  gasFee: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export interface Strategy {
  limitInflationFactor: number;
  priceInflationFactor: number;
  percentileThresholdFor1559Fee: number;
  thresholdToInflateLastBlockBaseFee: number;
  baseFeeMultiplier: number;
  baseFeeHistoryWindow: number;
  minPriorityFeeGwei: number;
  maxPriorityFeeGwei: number;
}

export interface AggregatedOutput {
  amount: string;
  token: string;
  recipient: string;
  bps: number;
  minAmount: string;
}

export interface PermitData {
  domain: Domain;
  types: Types;
  values: Values;
}

export interface Domain {
  name: string;
  chainId: number;
  verifyingContract: string;
}

export interface Types {
  PermitSingle: PermitSingle[];
  PermitDetails: PermitDetail[];
}

export interface PermitSingle {
  name: string;
  type: string;
}

export interface PermitDetail {
  name: string;
  type: string;
}

export interface Values {
  details: Details;
  spender: string;
  sigDeadline: string;
}

export interface Details {
  token: string;
  amount: string;
  expiration: string;
  nonce: string;
}
