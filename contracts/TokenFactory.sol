// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CustomToken.sol";

/**
 * @title TokenFactory
 * @dev Factory contract for creating new CustomToken instances
 */
contract TokenFactory {
    // Array of all tokens created
    address[] public tokens;
    
    // Mapping of creator address to their tokens
    mapping(address => address[]) public creatorTokens;
    
    // Event emitted when a new token is created
    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 initialSupply,
        uint8 decimals,
        bool transferable,
        address indexed creator
    );
    
    /**
     * @dev Creates a new CustomToken
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param initialSupply The initial supply of tokens
     * @param decimals The number of decimals for the token
     * @param transferable Whether the token can be transferred
     * @return The address of the newly created token
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint8 decimals,
        bool transferable
    ) public returns (address) {
        // Create new token with the caller as the creator/owner
        CustomToken newToken = new CustomToken(
            name,
            symbol,
            initialSupply,
            decimals,
            transferable,
            msg.sender
        );
        
        // Add token to arrays
        address tokenAddress = address(newToken);
        tokens.push(tokenAddress);
        creatorTokens[msg.sender].push(tokenAddress);
        
        // Emit event
        emit TokenCreated(
            tokenAddress,
            name,
            symbol,
            initialSupply,
            decimals,
            transferable,
            msg.sender
        );
        
        return tokenAddress;
    }
    
    /**
     * @dev Returns the total number of tokens created
     * @return The number of tokens created
     */
    function getTokenCount() public view returns (uint256) {
        return tokens.length;
    }
    
    /**
     * @dev Returns all tokens created by a specific creator
     * @param creator The address of the creator
     * @return Array of token addresses created by the creator
     */
    function getTokensByCreator(address creator) public view returns (address[] memory) {
        return creatorTokens[creator];
    }
    
    /**
     * @dev Returns the number of tokens created by a specific creator
     * @param creator The address of the creator
     * @return The number of tokens created by the creator
     */
    function getCreatorTokenCount(address creator) public view returns (uint256) {
        return creatorTokens[creator].length;
    }
}
