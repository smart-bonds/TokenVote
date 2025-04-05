// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CustomToken
 * @dev ERC20 token with permit functionality and customizable parameters
 * This token can be used for governance and has optional transferability control
 */
contract CustomToken is ERC20, ERC20Permit, Ownable {
    // Token decimals
    uint8 private _decimals;
    
    // Whether tokens can be transferred between accounts
    bool public transferable;
    
    // Mapping to track if an address is allowed to distribute tokens
    mapping(address => bool) public distributors;

    /**
     * @dev Emitted when token transferability is changed
     */
    event TransferabilityChanged(bool transferable);

    /**
     * @dev Emitted when a distributor is added or removed
     */
    event DistributorUpdated(address distributor, bool status);

    /**
     * @dev Constructor to create a new CustomToken
     * @param name_ token name
     * @param symbol_ token symbol
     * @param totalSupply_ total supply of tokens
     * @param decimals_ number of decimals for the token
     * @param initialOwner address of the initial token owner to receive the total supply
     * @param isTransferable whether tokens can be transferred between accounts
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        uint8 decimals_,
        address initialOwner,
        bool isTransferable
    ) ERC20(name_, symbol_) ERC20Permit(name_) Ownable(initialOwner) {
        _decimals = decimals_;
        transferable = isTransferable;
        _mint(initialOwner, totalSupply_ * (10 ** decimals_));
        
        // Add owner as a distributor
        distributors[initialOwner] = true;
        emit DistributorUpdated(initialOwner, true);
    }

    /**
     * @dev Returns the number of decimals used for the token
     */
    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Set whether the token is transferable
     * @param isTransferable new transferability status
     */
    function setTransferable(bool isTransferable) external onlyOwner {
        transferable = isTransferable;
        emit TransferabilityChanged(isTransferable);
    }

    /**
     * @dev Add or remove an address as a distributor
     * @param distributor address to update
     * @param status true to add as distributor, false to remove
     */
    function setDistributor(address distributor, bool status) external onlyOwner {
        distributors[distributor] = status;
        emit DistributorUpdated(distributor, status);
    }

    /**
     * @dev Check if tokens can be transferred
     * @param from sender address
     */
    function _update(address from, address to, uint256 value) internal override {
        // Check if transferability is restricted and it's not a mint or burn operation
        if (!transferable && from != address(0) && to != address(0)) {
            // Allow transfer if sender is a designated distributor
            require(distributors[from], "Token transfers are disabled");
        }
        super._update(from, to, value);
    }

    /**
     * @dev Allow token owner to distribute tokens to multiple addresses at once
     * @param recipients array of recipient addresses
     * @param amounts array of amounts to distribute
     */
    function distributeTokens(address[] calldata recipients, uint256[] calldata amounts) 
        external 
    {
        require(distributors[msg.sender], "Not authorized to distribute");
        require(recipients.length == amounts.length, "Arrays must have same length");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _transfer(msg.sender, recipients[i], amounts[i]);
        }
    }
}