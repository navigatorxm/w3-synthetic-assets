// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FlashToken.sol";

/**
 * @title FlashFactory
 * @dev Factory contract for deploying FlashToken instances
 * 
 * Manages the creation and registry of FlashToken assets.
 * Only the owner can create new tokens.
 */
contract FlashFactory is Ownable {
    // Mapping from symbol to token address
    mapping(string => address) private _tokens;
    
    // Array of all deployed token addresses
    address[] private _allTokens;

    // Events
    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        uint8 decimals
    );

    // Errors
    error TokenAlreadyExists(string symbol);
    error TokenNotFound(string symbol);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new FlashToken
     * @param name Token name
     * @param symbol Token symbol
     * @param decimals_ Number of decimals
     * @return The address of the newly created token
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) external onlyOwner returns (address) {
        if (_tokens[symbol] != address(0)) {
            revert TokenAlreadyExists(symbol);
        }

        FlashToken token = new FlashToken(name, symbol, decimals_);
        
        // Grant admin roles to factory owner
        token.grantRole(token.ADMIN_ROLE(), msg.sender);
        token.grantRole(token.MINTER_ROLE(), msg.sender);
        token.grantRole(token.PAUSER_ROLE(), msg.sender);
        
        // Renounce deployer role from factory
        token.renounceRole(token.ADMIN_ROLE(), address(this));

        address tokenAddress = address(token);
        _tokens[symbol] = tokenAddress;
        _allTokens.push(tokenAddress);

        emit TokenCreated(tokenAddress, name, symbol, decimals_);

        return tokenAddress;
    }

    /**
     * @dev Get token address by symbol
     * @param symbol The token symbol
     * @return The token address
     */
    function getToken(string memory symbol) external view returns (address) {
        address tokenAddress = _tokens[symbol];
        if (tokenAddress == address(0)) {
            revert TokenNotFound(symbol);
        }
        return tokenAddress;
    }

    /**
     * @dev Get all deployed token addresses
     * @return Array of token addresses
     */
    function getAllTokens() external view returns (address[] memory) {
        return _allTokens;
    }

    /**
     * @dev Get total number of deployed tokens
     * @return Number of tokens
     */
    function tokenCount() external view returns (uint256) {
        return _allTokens.length;
    }

    /**
     * @dev Check if a token exists
     * @param symbol The token symbol
     * @return True if token exists
     */
    function tokenExists(string memory symbol) external view returns (bool) {
        return _tokens[symbol] != address(0);
    }
}
