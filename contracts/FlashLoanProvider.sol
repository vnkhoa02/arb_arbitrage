// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@balancer-labs/v2-interfaces/contracts/vault/IVault.sol';
import '@balancer-labs/v2-interfaces/contracts/vault/IFlashLoanRecipient.sol';

/**
 * @title FlashLoanProvider
 * @dev Abstract contract that handles Balancer V2 flash loans
 */
abstract contract FlashLoanProvider is IFlashLoanRecipient, ReentrancyGuard {
    address public owner;

    address constant VAULT_ADDRESS = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;
    IVault internal constant vault = IVault(VAULT_ADDRESS);

    modifier onlyOwner() {
        require(msg.sender == owner, 'Not owner');
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function makeFlashLoan(
        IERC20[] memory tokens,
        uint256[] memory amounts,
        bytes memory userData
    ) internal {
        vault.flashLoan(this, tokens, amounts, userData);
    }

    function flashLoan(
        address[] memory tokens,
        uint256[] memory amounts,
        bytes memory userData
    ) internal {
        // Convert address[] to IERC20[]
        IERC20[] memory tokensI = new IERC20[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            tokensI[i] = IERC20(tokens[i]);
        }
        // Call the vault's flash loan function
        makeFlashLoan(tokensI, amounts, userData);
    }

    function receiveFlashLoan(
        IERC20[] memory tokens,
        uint256[] memory amounts,
        uint256[] memory feeAmounts,
        bytes memory userData
    ) external override {
        require(msg.sender == address(vault), 'FlashLoanProvider: Not vault');
        for (uint256 i = 0; i < tokens.length; i++) {
            _executeOperation(
                address(tokens[i]),
                amounts[i],
                feeAmounts[i],
                userData
            );
            uint256 totalDebt = amounts[i] + feeAmounts[i];
            tokens[i].transfer(address(vault), totalDebt);
        }
    }

    /**
     * @dev Hook for executing custom logic. Must be overridden.
     */
    function _executeOperation(
        address token,
        uint256 amount,
        uint256 fee,
        bytes memory userData
    ) internal virtual;

    function withdrawToken(address token) external onlyOwner {
        uint256 bal = IERC20(token).balanceOf(address(this));
        require(bal > 0, 'No token balance');
        IERC20(token).transfer(owner, bal);
    }

    receive() external payable {}
}
