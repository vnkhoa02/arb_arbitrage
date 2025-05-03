# ⚡ Advanced Arbitrage Smart Contract on Ethereum & Arbitrum

This project implements an **on-chain arbitrage bot** using **flash loans from Balancer**, executing profitable trades across **single** and **multiple decentralized exchanges** (DEXs) such as **Uniswap V3**. Built using **Solidity** and **Hardhat**, it is designed for deployment and simulation on **Ethereum Mainnet** and **Arbitrum**. Integration with **Tenderly** enables robust testing and debugging in a simulated environment.

---

## 🧠 Key Features

- 💸 **Balancer V2 Flash Loans**: Borrow assets with zero upfront capital
- 🔁 **Single & Multi-DEX Arbitrage**: Exploit pricing inefficiencies across Uniswap V3, Sushiswap, Camelot, etc.
- ⚖️ **Profit Verification Logic**: Ensure only profitable trades are executed
- 🧪 **Tenderly Integration**: Simulate transactions before going live
- ⚡ **Supports Ethereum & Arbitrum**: Fully compatible with both networks
- 🧩 **Modular Arbitrage Design**: Easily extend to new DEXs or routing strategies

---

## 📦 Stack

| Tool        | Description                                |
| ----------- | ------------------------------------------ |
| Solidity    | Smart contract language                    |
| Hardhat     | Dev framework for compilation & deployment |
| Tenderly    | Debugging, simulation, monitoring          |
| Balancer V2 | Flash loan provider                        |
| Uniswap V3  | Arbitrage execution engine (primary DEX)   |
| Arbitrum    | L2 deployment & faster settlement          |

---

## ⚙️ Installation

```bash
git clone https://github.com/vnkhoa02/arb_arbitrage.git
cd arb_arbitrage
npm install

git clone https://github.com/vnkhoa02/arb_arbitrage_scanner.git
cd arb_arbitrage_scanner
npm install
```
