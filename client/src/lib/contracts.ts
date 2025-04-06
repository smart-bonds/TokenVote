import { ethers } from "ethers";

// CustomToken ABI
export const CUSTOM_TOKEN_ABI = [
  // Read functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferable() view returns (bool)",
  "function owner() view returns (address)",
  
  // Write functions
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function setTransferable(bool _transferable)",
  "function transferOwnership(address newOwner)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Token Factory ABI
export const TOKEN_FACTORY_ABI = [
  // Read functions
  "function tokens(uint256 index) view returns (address)",
  "function creatorTokens(address creator, uint256 index) view returns (address)",
  "function getTokenCount() view returns (uint256)",
  "function getTokensByCreator(address creator) view returns (address[])",
  "function getCreatorTokenCount(address creator) view returns (uint256)",
  
  // Write functions
  "function createToken(string name, string symbol, uint256 initialSupply, uint8 decimals, bool transferable) returns (address)",
  
  // Events
  "event TokenCreated(address indexed tokenAddress, string name, string symbol, uint256 initialSupply, uint8 decimals, bool transferable, address indexed creator)"
];

// Governance ABI
export const GOVERNANCE_ABI = [
  // Read functions
  "function proposalCount() view returns (uint256)",
  "function getProposal(uint256 proposalId) view returns (tuple(uint256 id, string title, string description, address tokenAddress, address creator, uint256 startTime, uint256 endTime, uint256 quorum, uint256 votesFor, uint256 votesAgainst, bool executed))",
  "function hasVoted(uint256 proposalId, address voter) view returns (bool)",
  "function getVote(uint256 proposalId, address voter) view returns (bool voted, bool support, uint256 weight)",
  
  // Write functions
  "function createProposal(string title, string description, address tokenAddress, uint256 duration, uint256 quorumPercent) returns (uint256)",
  "function castVote(uint256 proposalId, bool support)",
  "function executeProposal(uint256 proposalId)",
  
  // Events
  "event ProposalCreated(uint256 indexed proposalId, string title, address indexed tokenAddress, address indexed creator, uint256 startTime, uint256 endTime, uint256 quorum)",
  "event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight)",
  "event ProposalExecuted(uint256 indexed proposalId, bool passed)"
];

// Mainnet addresses
export const TOKEN_FACTORY_ADDRESS = "0x69F14a29F815AF56c1efee18c92f266a77459C98";
export const GOVERNANCE_ADDRESS = "0x42b91cFF3FD5429C7bD8610b945C9aA8a2F9FBDD";

// Function to create a new ERC20 token using the Token Factory
export const createToken = async (
  signer: ethers.JsonRpcSigner,
  name: string, 
  symbol: string, 
  initialSupply: string,
  decimals: number,
  transferable: boolean
): Promise<string> => {
  try {
    // First, check if signer is available
    if (!signer) {
      throw new Error("No signer available");
    }
    
    // Parse initialSupply from string to BigInt
    const initialSupplyValue = ethers.parseUnits(initialSupply, decimals);
    
    // Connect to token factory contract
    const factory = new ethers.Contract(
      TOKEN_FACTORY_ADDRESS,
      TOKEN_FACTORY_ABI,
      signer
    );
    
    // Create token transaction
    const tx = await factory.createToken(
      name, 
      symbol, 
      initialSupplyValue,
      decimals,
      transferable
    );
    
    // Wait for transaction to complete
    const receipt = await tx.wait();
    
    // Find the TokenCreated event in the receipt
    const event = receipt.logs
      .map((log: any) => {
        try {
          return factory.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .find((event: any) => event && event.name === 'TokenCreated');
    
    // Get the token address from the event
    const tokenAddress = event ? event.args.tokenAddress : null;
    
    if (!tokenAddress) {
      throw new Error("Failed to create token: No token address in event");
    }
    
    return tokenAddress;
  } catch (error) {
    console.error("Error creating token:", error);
    throw error;
  }
};

// Function to get token info from the token contract
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
    // First, check if provider is available
    if (!provider) {
      throw new Error("No provider available");
    }
    
    // Connect to token contract
    const tokenContract = new ethers.Contract(
      tokenAddress,
      CUSTOM_TOKEN_ABI,
      provider
    );
    
    // Get token details
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals(),
      tokenContract.totalSupply()
    ]);
    
    return {
      name,
      symbol,
      decimals,
      totalSupply: totalSupply.toString()
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
    // First, check if provider is available
    if (!provider) {
      throw new Error("No provider available");
    }
    
    // Validate token address
    if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
      console.warn(`Invalid token address: ${tokenAddress}`);
      return "0";
    }
    
    // Connect to token contract
    const tokenContract = new ethers.Contract(
      tokenAddress,
      CUSTOM_TOKEN_ABI,
      provider
    );
    
    try {
      // Get token balance with timeout to prevent long hangs
      const balance = await Promise.race([
        tokenContract.balanceOf(walletAddress),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error("Token balance request timed out")), 5000)
        )
      ]);
      
      return balance.toString();
    } catch (innerError) {
      console.warn(`Error fetching balance for token ${tokenAddress}:`, innerError);
      return "0"; // Return 0 as fallback
    }
  } catch (error) {
    console.error("Error getting token balance:", error);
    return "0"; // Return 0 instead of throwing to improve UI resilience
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
    // First, check if signer is available
    if (!signer) {
      throw new Error("No signer available");
    }
    
    // Connect to token contract with signer
    const tokenContract = new ethers.Contract(
      tokenAddress,
      CUSTOM_TOKEN_ABI,
      signer
    );
    
    // Get decimals to correctly parse the amount
    const decimals = await tokenContract.decimals();
    
    // Parse amount from string to BigInt
    const amountValue = ethers.parseUnits(amount, decimals);
    
    // Transfer tokens
    const tx = await tokenContract.transfer(recipientAddress, amountValue);
    
    // Wait for transaction to complete
    const receipt = await tx.wait();
    
    return receipt.hash;
  } catch (error) {
    console.error("Error transferring tokens:", error);
    throw error;
  }
};

// Function to create a new governance proposal
export const createProposal = async (
  signer: ethers.JsonRpcSigner,
  title: string,
  description: string,
  tokenAddress: string,
  durationDays: number,
  quorumPercent: number
): Promise<number> => {
  try {
    // First, check if signer is available
    if (!signer) {
      throw new Error("No signer available");
    }
    
    // Connect to governance contract
    const governance = new ethers.Contract(
      GOVERNANCE_ADDRESS,
      GOVERNANCE_ABI,
      signer
    );
    
    // Convert duration from days to seconds
    const duration = durationDays * 24 * 60 * 60;
    
    // Create proposal transaction
    const tx = await governance.createProposal(
      title,
      description,
      tokenAddress,
      duration,
      quorumPercent
    );
    
    // Wait for transaction to complete
    const receipt = await tx.wait();
    
    // Find the ProposalCreated event in the receipt
    const event = receipt.logs
      .map((log: any) => {
        try {
          return governance.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .find((event: any) => event && event.name === 'ProposalCreated');
    
    // Get the proposal ID from the event
    const proposalId = event ? event.args.proposalId : null;
    
    if (!proposalId) {
      throw new Error("Failed to create proposal: No proposal ID in event");
    }
    
    return Number(proposalId);
  } catch (error) {
    console.error("Error creating proposal:", error);
    throw error;
  }
};

// Function to vote on a proposal
export const voteOnProposal = async (
  signer: ethers.JsonRpcSigner,
  proposalId: number,
  support: boolean
): Promise<string> => {
  try {
    // First, check if signer is available
    if (!signer) {
      throw new Error("No signer available");
    }
    
    // Connect to governance contract
    const governance = new ethers.Contract(
      GOVERNANCE_ADDRESS,
      GOVERNANCE_ABI,
      signer
    );
    
    // Cast vote
    const tx = await governance.castVote(proposalId, support);
    
    // Wait for transaction to complete
    const receipt = await tx.wait();
    
    return receipt.hash;
  } catch (error) {
    console.error("Error voting on proposal:", error);
    throw error;
  }
};

// Function to get proposal details
export const getProposal = async (
  provider: ethers.BrowserProvider,
  proposalId: number
): Promise<{
  id: number;
  title: string;
  description: string;
  tokenAddress: string;
  creator: string;
  startTime: number;
  endTime: number;
  quorum: number;
  votesFor: string;
  votesAgainst: string;
  executed: boolean;
}> => {
  try {
    // First, check if provider is available
    if (!provider) {
      throw new Error("No provider available");
    }
    
    // Connect to governance contract
    const governance = new ethers.Contract(
      GOVERNANCE_ADDRESS,
      GOVERNANCE_ABI,
      provider
    );
    
    // Get proposal
    const proposal = await governance.getProposal(proposalId);
    
    return {
      id: Number(proposal.id),
      title: proposal.title,
      description: proposal.description,
      tokenAddress: proposal.tokenAddress,
      creator: proposal.creator,
      startTime: Number(proposal.startTime),
      endTime: Number(proposal.endTime),
      quorum: Number(proposal.quorum),
      votesFor: proposal.votesFor.toString(),
      votesAgainst: proposal.votesAgainst.toString(),
      executed: proposal.executed
    };
  } catch (error) {
    console.error("Error getting proposal:", error);
    throw error;
  }
};
