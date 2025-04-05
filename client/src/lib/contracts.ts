import { ethers } from "ethers";

// ERC20 Token Contract ABI (minimal interface for our needs)
export const ERC20_ABI = [
  // Read functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  
  // Write functions
  "function transfer(address to, uint256 value) returns (bool)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Simple ERC20 Token Factory bytecode
export const TOKEN_FACTORY_ABI = [
  "function createToken(string name, string symbol, uint256 initialSupply, uint8 decimals, bool transferable) returns (address)",
  "event TokenCreated(address indexed creator, address indexed tokenAddress, string name, string symbol, uint256 initialSupply)"
];

// Sample factory address - in a real app, this would be deployed to the blockchain
export const TOKEN_FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Function to create a new ERC20 token
export const createToken = async (
  signer: ethers.JsonRpcSigner,
  name: string, 
  symbol: string, 
  initialSupply: string,
  decimals: number,
  transferable: boolean
): Promise<string> => {
  try {
    // In a real implementation, we would use a deployed factory contract
    // For this demo, we'll simulate token creation
    
    // First, check if MetaMask is connected
    if (!signer) {
      throw new Error("No signer available");
    }
    
    // Simulate contract deployment delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a fake token address
    const randomBytes = ethers.randomBytes(20);
    const tokenAddress = ethers.hexlify(randomBytes);
    
    // In a real implementation, this would be the actual token contract address
    return tokenAddress;
  } catch (error) {
    console.error("Error creating token:", error);
    throw error;
  }
};

// Function to get ERC20 token info (returns mock data for demo)
export const getTokenInfo = async (
  provider: ethers.BrowserProvider,
  tokenAddress: string
): Promise<{
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}> => {
  try {
    // In a real implementation, we would query the actual ERC20 contract
    // For this demo, we'll return mock data
    
    // First, check if provider is available
    if (!provider) {
      throw new Error("No provider available");
    }
    
    // Mock token info
    return {
      name: "Mock Token",
      symbol: "MOCK",
      decimals: 18,
      totalSupply: ethers.parseEther("1000000").toString()
    };
  } catch (error) {
    console.error("Error getting token info:", error);
    throw error;
  }
};

// Function to get token balance for an address
export const getTokenBalance = async (
  provider: ethers.BrowserProvider,
  tokenAddress: string,
  walletAddress: string
): Promise<string> => {
  try {
    // In a real implementation, we would query the actual ERC20 contract
    // For this demo, we'll return mock data
    
    // First, check if provider is available
    if (!provider) {
      throw new Error("No provider available");
    }
    
    // Mock balance (75% of total supply)
    return ethers.parseEther("750000").toString();
  } catch (error) {
    console.error("Error getting token balance:", error);
    throw error;
  }
};

// Function to transfer tokens to another address
export const transferTokens = async (
  signer: ethers.JsonRpcSigner,
  tokenAddress: string,
  recipientAddress: string,
  amount: string
): Promise<string> => {
  try {
    // In a real implementation, we would call the actual ERC20 contract
    // For this demo, we'll simulate a transfer
    
    // First, check if signer is available
    if (!signer) {
      throw new Error("No signer available");
    }
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a fake transaction hash
    const randomBytes = ethers.randomBytes(32);
    const txHash = ethers.hexlify(randomBytes);
    
    // In a real implementation, this would be the actual transaction hash
    return txHash;
  } catch (error) {
    console.error("Error transferring tokens:", error);
    throw error;
  }
};
