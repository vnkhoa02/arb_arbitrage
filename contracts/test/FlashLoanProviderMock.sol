// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import '../FlashLoanProvider.sol';

contract FlashLoanProviderMock is FlashLoanProvider {
    /// @notice Emitted when the hook is called
    event Executed(
        address indexed token,
        uint256 amount,
        uint256 fee,
        bytes userData
    );

    /// @notice allow us to call customFlashLoan from tests
    function testFlashLoan(
        address[] memory tokens,
        uint256[] memory amounts,
        bytes memory userData
    ) external onlyOwner {
        flashLoan(tokens, amounts, userData);
    }

    /// @dev override the abstract hook and emit an event
    function _executeOperation(
        address token,
        uint256 amount,
        uint256 fee,
        bytes memory userData
    ) internal override {
        emit Executed(token, amount, fee, userData);
    }
}
