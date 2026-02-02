// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IFlashToken.sol";

/**
 * @title FlashToken
 * @dev ERC-20 compatible token with per-holder expiry functionality
 * 
 * Features:
 * - Standard ERC-20 functionality
 * - Per-holder expiry timestamps
 * - Expired tokens become non-transferable
 * - Admin minting with custom expiry
 * - Batch minting support
 * - Burnable by admin
 * - Pausable for emergencies
 */
contract FlashToken is ERC20, IFlashToken, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Mapping from holder address to expiry timestamp
    mapping(address => uint256) private _expiries;

    // Token decimals (immutable)
    uint8 private immutable _decimals;

    // Events
    event TokenMinted(address indexed to, uint256 amount, uint256 expiry);
    event TokenBurned(address indexed from, uint256 amount);
    event ExpiryUpdated(address indexed account, uint256 newExpiry);
    event BatchMinted(address[] recipients, uint256[] amounts, uint256[] expiries);

    // Errors
    error TokenExpired(address account, uint256 expiry);
    error ArrayLengthMismatch();
    error ZeroAddress();
    error ZeroAmount();
    error ExpiryInPast();

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
     * @dev Returns the expiry timestamp for an account
     * @param account The address to check
     */
    function expiryOf(address account) public view returns (uint256) {
        return _expiries[account];
    }

    /**
     * @dev Checks if an account's tokens have expired
     * @param account The address to check
     */
    function isExpired(address account) public view returns (bool) {
        uint256 expiry = _expiries[account];
        return expiry > 0 && block.timestamp >= expiry;
    }

    /**
     * @dev Mint tokens to an address with expiry
     * @param to Recipient address
     * @param amount Amount to mint
     * @param expiry Expiry timestamp
     */
    function mint(
        address to,
        uint256 amount,
        uint256 expiry
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (expiry <= block.timestamp) revert ExpiryInPast();

        _mint(to, amount);
        
        // If recipient already has tokens, use the later expiry
        if (_expiries[to] < expiry) {
            _expiries[to] = expiry;
        }

        emit TokenMinted(to, amount, expiry);
    }

    /**
     * @dev Batch mint tokens to multiple addresses
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts
     * @param expiries Array of expiry timestamps
     */
    function batchMint(
        address[] calldata recipients,
        uint256[] calldata amounts,
        uint256[] calldata expiries
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant {
        if (recipients.length != amounts.length || amounts.length != expiries.length) {
            revert ArrayLengthMismatch();
        }

        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            if (amounts[i] == 0) revert ZeroAmount();
            if (expiries[i] <= block.timestamp) revert ExpiryInPast();

            _mint(recipients[i], amounts[i]);
            
            if (_expiries[recipients[i]] < expiries[i]) {
                _expiries[recipients[i]] = expiries[i];
            }
        }

        emit BatchMinted(recipients, amounts, expiries);
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
        
        // Reset expiry if balance is now zero
        if (balanceOf(account) == 0) {
            _expiries[account] = 0;
        }

        emit TokenBurned(account, amount);
    }

    /**
     * @dev Update expiry for an account (admin only)
     * @param account Address to update
     * @param newExpiry New expiry timestamp
     */
    function updateExpiry(
        address account,
        uint256 newExpiry
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        if (account == address(0)) revert ZeroAddress();
        // Allow zero (clear expiry) or future timestamp only
        if (newExpiry != 0 && newExpiry <= block.timestamp) revert ExpiryInPast();
        
        _expiries[account] = newExpiry;
        emit ExpiryUpdated(account, newExpiry);
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
     * @dev Override transfer to check expiry
     */
    function transfer(
        address to,
        uint256 amount
    ) public virtual override whenNotPaused returns (bool) {
        _checkNotExpired(msg.sender);
        return super.transfer(to, amount);
    }

    /**
     * @dev Override transferFrom to check expiry
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override whenNotPaused returns (bool) {
        _checkNotExpired(from);
        return super.transferFrom(from, to, amount);
    }

    /**
     * @dev Internal function to check if account is not expired
     */
    function _checkNotExpired(address account) internal view {
        if (isExpired(account)) {
            revert TokenExpired(account, _expiries[account]);
        }
    }

    /**
     * @dev Override _update to handle expiry inheritance on transfers
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override {
        super._update(from, to, value);

        // If recipient doesn't have an expiry, inherit from sender
        if (from != address(0) && to != address(0) && _expiries[to] == 0) {
            _expiries[to] = _expiries[from];
        }
    }
}
