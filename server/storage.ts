import { 
  users, type User, type InsertUser,
  tokens, type Token, type InsertToken,
  proposals, type Proposal, type InsertProposal,
  votes, type Vote, type InsertVote
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Token operations
  getTokenById(id: number): Promise<Token | undefined>;
  getTokenByAddress(contractAddress: string): Promise<Token | undefined>;
  getTokensByCreator(creatorAddress: string): Promise<Token[]>;
  getAllTokens(): Promise<Token[]>;
  createToken(token: InsertToken): Promise<Token>;
  
  // Proposal operations
  getProposalById(id: number): Promise<Proposal | undefined>;
  getProposalsByToken(tokenAddress: string): Promise<Proposal[]>;
  getProposalsByCreator(creatorAddress: string): Promise<Proposal[]>;
  getAllProposals(): Promise<Proposal[]>;
  getActiveProposals(): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposalVotes(id: number, votesFor: string, votesAgainst: string): Promise<Proposal>;
  closeProposal(id: number): Promise<Proposal>;
  
  // Vote operations
  getVoteById(id: number): Promise<Vote | undefined>;
  getVotesByProposal(proposalId: number): Promise<Vote[]>;
  getVotesByVoter(voterAddress: string): Promise<Vote[]>;
  createVote(vote: InsertVote): Promise<Vote>;
  hasVoted(proposalId: number, voterAddress: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tokens: Map<number, Token>;
  private proposals: Map<number, Proposal>;
  private votes: Map<number, Vote>;
  
  private userId: number;
  private tokenId: number;
  private proposalId: number;
  private voteId: number;

  constructor() {
    this.users = new Map();
    this.tokens = new Map();
    this.proposals = new Map();
    this.votes = new Map();
    
    this.userId = 1;
    this.tokenId = 1;
    this.proposalId = 1;
    this.voteId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress.toLowerCase() === walletAddress.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Token operations
  async getTokenById(id: number): Promise<Token | undefined> {
    return this.tokens.get(id);
  }

  async getTokenByAddress(contractAddress: string): Promise<Token | undefined> {
    return Array.from(this.tokens.values()).find(
      (token) => token.contractAddress.toLowerCase() === contractAddress.toLowerCase(),
    );
  }

  async getTokensByCreator(creatorAddress: string): Promise<Token[]> {
    return Array.from(this.tokens.values()).filter(
      (token) => token.creatorAddress.toLowerCase() === creatorAddress.toLowerCase(),
    );
  }

  async getAllTokens(): Promise<Token[]> {
    return Array.from(this.tokens.values());
  }

  async createToken(insertToken: InsertToken): Promise<Token> {
    const id = this.tokenId++;
    const now = new Date();
    const token: Token = { ...insertToken, id, createdAt: now };
    this.tokens.set(id, token);
    return token;
  }

  // Proposal operations
  async getProposalById(id: number): Promise<Proposal | undefined> {
    return this.proposals.get(id);
  }

  async getProposalsByToken(tokenAddress: string): Promise<Proposal[]> {
    return Array.from(this.proposals.values()).filter(
      (proposal) => proposal.tokenAddress.toLowerCase() === tokenAddress.toLowerCase(),
    );
  }

  async getProposalsByCreator(creatorAddress: string): Promise<Proposal[]> {
    return Array.from(this.proposals.values()).filter(
      (proposal) => proposal.creatorAddress.toLowerCase() === creatorAddress.toLowerCase(),
    );
  }

  async getAllProposals(): Promise<Proposal[]> {
    return Array.from(this.proposals.values());
  }

  async getActiveProposals(): Promise<Proposal[]> {
    const now = new Date();
    return Array.from(this.proposals.values()).filter(
      (proposal) => proposal.status === "active" && proposal.endDate > now,
    );
  }

  async createProposal(insertProposal: InsertProposal): Promise<Proposal> {
    const id = this.proposalId++;
    const now = new Date();
    const proposal: Proposal = { 
      ...insertProposal,
      id, 
      votesFor: "0",
      votesAgainst: "0",
      status: "active",
      createdAt: now 
    };
    this.proposals.set(id, proposal);
    return proposal;
  }

  async updateProposalVotes(id: number, votesFor: string, votesAgainst: string): Promise<Proposal> {
    const proposal = this.proposals.get(id);
    if (!proposal) {
      throw new Error(`Proposal with id ${id} not found`);
    }
    
    const updatedProposal: Proposal = {
      ...proposal,
      votesFor,
      votesAgainst,
    };
    
    this.proposals.set(id, updatedProposal);
    return updatedProposal;
  }

  async closeProposal(id: number): Promise<Proposal> {
    const proposal = this.proposals.get(id);
    if (!proposal) {
      throw new Error(`Proposal with id ${id} not found`);
    }
    
    const updatedProposal: Proposal = {
      ...proposal,
      status: "completed",
    };
    
    this.proposals.set(id, updatedProposal);
    return updatedProposal;
  }

  // Vote operations
  async getVoteById(id: number): Promise<Vote | undefined> {
    return this.votes.get(id);
  }

  async getVotesByProposal(proposalId: number): Promise<Vote[]> {
    return Array.from(this.votes.values()).filter(
      (vote) => vote.proposalId === proposalId,
    );
  }

  async getVotesByVoter(voterAddress: string): Promise<Vote[]> {
    return Array.from(this.votes.values()).filter(
      (vote) => vote.voterAddress.toLowerCase() === voterAddress.toLowerCase(),
    );
  }

  async createVote(insertVote: InsertVote): Promise<Vote> {
    const id = this.voteId++;
    const now = new Date();
    const vote: Vote = { ...insertVote, id, timestamp: now };
    this.votes.set(id, vote);
    
    // Update proposal votes
    const proposal = await this.getProposalById(insertVote.proposalId);
    if (proposal) {
      const voteAmount = insertVote.voteAmount;
      let votesFor = proposal.votesFor;
      let votesAgainst = proposal.votesAgainst;
      
      if (insertVote.voteDirection === "for") {
        votesFor = (BigInt(votesFor) + BigInt(voteAmount)).toString();
      } else {
        votesAgainst = (BigInt(votesAgainst) + BigInt(voteAmount)).toString();
      }
      
      await this.updateProposalVotes(proposal.id, votesFor, votesAgainst);
    }
    
    return vote;
  }

  async hasVoted(proposalId: number, voterAddress: string): Promise<boolean> {
    const votes = await this.getVotesByProposal(proposalId);
    return votes.some(vote => vote.voterAddress.toLowerCase() === voterAddress.toLowerCase());
  }
}

export const storage = new MemStorage();
