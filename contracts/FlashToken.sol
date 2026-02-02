// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FlashToken
 * @dev BEP-20 compatible token with role-based minting
 * 
 * Features:
 * - Standard BEP-20/ERC-20 functionality
 * - Role-based access control for minting
 * - Admin-only burning
 * - Pausable for emergencies
 * - No expiry logic - tokens are permanent
 */
contract FlashToken is ERC20, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Token decimals (immutable)
    uint8 private immutable _decimals;

    // Events
    event TokenMinted(address indexed to, uint256 amount);
    event TokenBurned(address indexed from, uint256 amount);
    event BatchMinted(address[] recipients, uint256[] amounts);

    // Errors
    error ArrayLengthMismatch();
    error ZeroAddress();
    error ZeroAmount();

    /**
     * @dev Constructor
     * @param name Token name
     * @param symbol Token symbol
     * @param decimals_ Number of decimals
     */
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        
        // Grant roles to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @dev Returns the number of decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mint tokens to an address
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(
        address to,
        uint256 amount
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        _mint(to, amount);

        emit TokenMinted(to, amount);
    }

    /**
     * @dev Batch mint tokens to multiple addresses
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts
     */
    function batchMint(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant {
        if (recipients.length != amounts.length) {
            revert ArrayLengthMismatch();
        }

        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            if (amounts[i] == 0) revert ZeroAmount();

            _mint(recipients[i], amounts[i]);
        }

        emit BatchMinted(recipients, amounts);
    }

    /**
     * @dev Burn tokens from an address (admin only)
     * @param account Address to burn from
     * @param amount Amount to burn
     */
    function burn(
        address account,
        uint256 amount
    ) external onlyRole(ADMIN_ROLE) whenNotPaused nonReentrant {
        if (account == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        _burn(account, amount);

        emit TokenBurned(account, amount);
    }

    /**
     * @dev Pause all token operations
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause token operations
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Override transfer to check pause state
     */
    function transfer(
        address to,
        uint256 amount
    ) public virtual override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }

    /**
     * @dev Override transferFrom to check pause state
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override whenNotPaused returns (bool) {
        return super.transferFrom(from, to, amount);
    }
}
