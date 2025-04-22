// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Arbitrage {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, 'Not the contract owner');
        _;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, 'No funds to withdraw');
        payable(owner).transfer(balance);
    }

}
