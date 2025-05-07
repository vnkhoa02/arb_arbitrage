export const mockRoute = {
  forward: {
    route: [
      [
        {
          type: 'v3-pool',
          address: '0x11b815efB8f581194ae79006d24E0d814B7697F6',
          tokenIn: {
            chainId: 1,
            decimals: '18',
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            symbol: 'WETH',
          },
          tokenOut: {
            chainId: 1,
            decimals: '6',
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            symbol: 'USDT',
          },
          fee: '500',
          liquidity: '1598795574947669530',
          sqrtRatioX96: '3398592063644030404241014',
          tickCurrent: '-201145',
          amountIn: '1000000000000000000',
          amountOut: '1834522179',
        },
      ],
    ],
    amountOut: '1834.52218',
    amountIn: '1',
    tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    tokenOut: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
  backward: {
    route: [
      [
        {
          type: 'v3-pool',
          address: '0x11b815efB8f581194ae79006d24E0d814B7697F6',
          tokenIn: {
            chainId: 1,
            decimals: '6',
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            symbol: 'USDT',
          },
          tokenOut: {
            chainId: 1,
            decimals: '18',
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            symbol: 'WETH',
          },
          fee: '500',
          liquidity: '1598795574947669530',
          sqrtRatioX96: '3398592063644030404241014',
          tickCurrent: '-201145',
          amountIn: '1834522180',
          amountOut: '993958262149959799',
        },
      ],
    ],
    amountOut: '0.9939582621499598',
    amountIn: '1834.52218',
    tokenIn: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
  roundTrip: {
    profit: '-0.006041737850040252',
    isProfitable: false,
    route: [
      [
        {
          type: 'v3-pool',
          address: '0x11b815efB8f581194ae79006d24E0d814B7697F6',
          tokenIn: {
            chainId: 1,
            decimals: '18',
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            symbol: 'WETH',
          },
          tokenOut: {
            chainId: 1,
            decimals: '6',
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            symbol: 'USDT',
          },
          fee: '500',
          liquidity: '1598795574947669530',
          sqrtRatioX96: '3398592063644030404241014',
          tickCurrent: '-201145',
          amountIn: '1000000000000000000',
          amountOut: '1834522179',
        },
      ],
      [
        {
          type: 'v3-pool',
          address: '0x11b815efB8f581194ae79006d24E0d814B7697F6',
          tokenIn: {
            chainId: 1,
            decimals: '6',
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            symbol: 'USDT',
          },
          tokenOut: {
            chainId: 1,
            decimals: '18',
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            symbol: 'WETH',
          },
          fee: '500',
          liquidity: '1598795574947669530',
          sqrtRatioX96: '3398592063644030404241014',
          tickCurrent: '-201145',
          amountIn: '1834522180',
          amountOut: '993958262149959799',
        },
      ],
    ],
  },
};
