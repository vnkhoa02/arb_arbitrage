export const mockRoute = {
  forward: {
    route: [
      [
        {
          type: 'v3-pool',
          address: '0x2f5e87C9312fa29aed5c179E456625D79015299c',
          tokenIn: {
            chainId: 42161,
            decimals: '18',
            address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
            symbol: 'WETH',
          },
          tokenOut: {
            chainId: 42161,
            decimals: '8',
            address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
            symbol: 'WBTC',
          },
          fee: '500',
          liquidity: '214870649975605805',
          sqrtRatioX96: '57151070415862443889688493317496452',
          tickCurrent: '269791',
          amountIn: '500000000000000000',
        },
        {
          type: 'v3-pool',
          address: '0x5969EFddE3cF5C0D9a88aE51E47d721096A97203',
          tokenIn: {
            chainId: 42161,
            decimals: '8',
            address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
            symbol: 'WBTC',
          },
          tokenOut: {
            chainId: 42161,
            decimals: '6',
            address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            symbol: 'USDT',
          },
          fee: '500',
          liquidity: '2496309973232',
          sqrtRatioX96: '2440155791528018292174769649545',
          tickCurrent: '68553',
          amountOut: '908296814',
        },
      ],
      [
        {
          type: 'v3-pool',
          address: '0xC6962004f452bE9203591991D15f6b388e09E8D0',
          tokenIn: {
            chainId: 42161,
            decimals: '18',
            address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
            symbol: 'WETH',
          },
          tokenOut: {
            chainId: 42161,
            decimals: '6',
            address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            symbol: 'USDC',
          },
          fee: '500',
          liquidity: '5972259393228540378',
          sqrtRatioX96: '3382489263520076166827285',
          tickCurrent: '-201240',
          amountIn: '250000000000000000',
        },
        {
          type: 'v3-pool',
          address: '0xbE3aD6a5669Dc0B8b12FeBC03608860C31E2eef6',
          tokenIn: {
            chainId: 42161,
            decimals: '6',
            address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            symbol: 'USDC',
          },
          tokenOut: {
            chainId: 42161,
            decimals: '6',
            address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            symbol: 'USDT',
          },
          fee: '100',
          liquidity: '16637131247498889',
          sqrtRatioX96: '79217791891630397463911317025',
          tickCurrent: '-3',
          amountOut: '454141798',
        },
      ],
      [
        {
          type: 'v3-pool',
          address: '0x641C00A822e8b671738d32a431a4Fb6074E5c79d',
          tokenIn: {
            chainId: 42161,
            decimals: '18',
            address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
            symbol: 'WETH',
          },
          tokenOut: {
            chainId: 42161,
            decimals: '6',
            address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            symbol: 'USDT',
          },
          fee: '500',
          liquidity: '842564593213168429',
          sqrtRatioX96: '3381901369134112758921133',
          tickCurrent: '-201244',
          amountIn: '250000000000000000',
          amountOut: '454143310',
        },
      ],
    ],
    amountOut: '1816.581924',
    amountIn: '1',
    tokenIn: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
    tokenOut: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  },
  backward: {
    route: [
      [
        {
          type: 'v3-pool',
          address: '0x641C00A822e8b671738d32a431a4Fb6074E5c79d',
          tokenIn: {
            chainId: 42161,
            decimals: '6',
            address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            symbol: 'USDT',
          },
          tokenOut: {
            chainId: 42161,
            decimals: '18',
            address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
            symbol: 'WETH',
          },
          fee: '500',
          liquidity: '842564593213168429',
          sqrtRatioX96: '3381901369134112758921133',
          tickCurrent: '-201244',
          amountIn: '1816581924',
          amountOut: '993953481543677213',
        },
      ],
    ],
    amountOut: '0.9939534815436771',
    amountIn: '1816.581924',
    tokenIn: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    tokenOut: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  },
};
