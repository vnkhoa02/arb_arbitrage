export interface ArbPathResult {
  profit: number; // in USDT
  profitPct: number; // % relative to USDT spent
  buyLabel: string; // e.g. "Low"
  sellLabel: string; // e.g. "High"
  buyFee: number; // basis points
  sellFee: number; // basis points
  buyPrice: number; // USDT per tokenIn
  sellPrice: number; // USDT per tokenIn
  totalFeePct: number; // swapFees + flashLoanFee (decimal, e.g. 0.005)
}

export interface ArbPath {
  amountIn: number;
  forward: ArbForward;
  backward: ArbBackward;
  roundTrip: ArbRoundTrip;
}

export interface ArbForward {
  profit: number;
  profitPct: number;
  buyLabel: string;
  sellLabel: string;
  buyFee: number;
  sellFee: number;
  buyPrice: number;
  sellPrice: number;
  totalFeePct: number;
}

export interface ArbBackward {
  profit: number;
  profitPct: number;
  buyLabel: string;
  sellLabel: string;
  buyFee: number;
  sellFee: number;
  buyPrice: number;
  sellPrice: number;
  totalFeePct: number;
}

export interface ArbRoundTrip {
  profit: number;
  profitPct: number;
  isProfitable: boolean;
}
