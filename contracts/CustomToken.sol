// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CustomToken
 * @dev ERC20 token with additional governance features
 */
contract CustomToken is ERC20, Ownable {
    uint8 private _decimals;
    bool public transferable;

    /**
     * @dev Constructor for creating a new token
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param initialSupply The initial supply of tokens
     * @param tokenDecimals The number of decimals for the token
     * @param isTransferable Whether the token can be transferred
     * @param creator The creator and initial owner of the token
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint8 tokenDecimals,
        bool isTransferable,
        address creator
    ) ERC20(name, symbol) Ownable(creator) {
        _decimals = tokenDecimals;
        transferable = isTransferable;
        _mint(creator, initialSupply);
    }

    /**
     * @dev Returns the number of decimals used for the token
     */
    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mints new tokens
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Sets whether the token can be transferred
     * @param _transferable Whether the token can be transferred
     */
    function setTransferable(bool _transferable) public onlyOwner {
        transferable = _transferable;
    }

    /**
     * @dev Hook that is called before any transfer
     */
    function _update(address from, address to, uint256 value) internal override {
        // Allow minting by the owner even if transfers are disabled
        if (from != address(0) && !transferable) {
            revert("Token transfers are disabled");
        }
        super._update(from, to, value);
    }
}
