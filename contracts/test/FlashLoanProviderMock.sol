// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import '../FlashLoanProvider.sol';
import 'hardhat/console.sol';

contract FlashLoanProviderMock is FlashLoanProvider {
    bool public simulateDefault = true;

    function setSimulateDefault(bool value) external {
        simulateDefault = value;
    }

    /// @notice allow us to call customFlashLoan from tests
    function testFlashLoan(
        address[] memory tokens,
        uint256[] memory amounts,
        bytes memory userData
    ) external onlyOwner {
        flashLoan(tokens, amounts, userData);
    }

    function _executeOperation(
        address token,
        uint256 amount,
        uint256 fee,
        bytes memory /* userData */
    ) internal override {
        console.log('Received flash loan:', token, amount, fee);
        if (simulateDefault) {
            IERC20(token).transfer(VAULT_ADDRESS, amount + fee); // full repayment
        } else {
            amount = amount + fee - 100; // simulate underpayment
            console.log('Simulating underpayment:', amount);
            IERC20(token).transfer(VAULT_ADDRESS, amount); // intentionally underpay
        }
    }
}
