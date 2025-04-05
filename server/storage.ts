import { 
  users, type User, type InsertUser,
  tokens, type Token, type InsertToken,
  proposals, type Proposal, type InsertProposal,
  votes, type Vote, type InsertVote
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lt, gt } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    // This is a simplification - in a production environment, we would need to handle case insensitivity more robustly
    const allUsers = await db.select().from(users);
    const user = allUsers.find(user => user.walletAddress.toLowerCase() === walletAddress.toLowerCase());
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Token operations
  async getTokenById(id: number): Promise<Token | undefined> {
    const [token] = await db.select().from(tokens).where(eq(tokens.id, id));
    return token;
  }

  async getTokenByAddress(contractAddress: string): Promise<Token | undefined> {
    const allTokens = await db.select().from(tokens);
    const token = allTokens.find(token => token.contractAddress.toLowerCase() === contractAddress.toLowerCase());
    return token;
  }

  async getTokensByCreator(creatorAddress: string): Promise<Token[]> {
    const allTokens = await db.select().from(tokens);
    return allTokens.filter(token => token.creatorAddress.toLowerCase() === creatorAddress.toLowerCase());
  }

  async getAllTokens(): Promise<Token[]> {
    return await db.select().from(tokens);
  }

  async createToken(insertToken: InsertToken): Promise<Token> {
    const [token] = await db
      .insert(tokens)
      .values(insertToken)
      .returning();
    return token;
  }

  // Proposal operations
  async getProposalById(id: number): Promise<Proposal | undefined> {
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
    return proposal;
  }

  async getProposalsByToken(tokenAddress: string): Promise<Proposal[]> {
    const allProposals = await db.select().from(proposals);
    return allProposals.filter(proposal => proposal.tokenAddress.toLowerCase() === tokenAddress.toLowerCase());
  }

  async getProposalsByCreator(creatorAddress: string): Promise<Proposal[]> {
    const allProposals = await db.select().from(proposals);
    return allProposals.filter(proposal => proposal.creatorAddress.toLowerCase() === creatorAddress.toLowerCase());
  }

  async getAllProposals(): Promise<Proposal[]> {
    return await db.select().from(proposals);
  }

  async getActiveProposals(): Promise<Proposal[]> {
    const now = new Date();
    return await db
      .select()
      .from(proposals)
      .where(
        and(
          eq(proposals.status, "active"),
          gt(proposals.endDate, now)
        )
      );
  }

  async createProposal(insertProposal: InsertProposal): Promise<Proposal> {
    const [proposal] = await db
      .insert(proposals)
      .values({
        ...insertProposal,
        votesFor: "0",
        votesAgainst: "0",
        status: "active"
      })
      .returning();
    return proposal;
  }

  async updateProposalVotes(id: number, votesFor: string, votesAgainst: string): Promise<Proposal> {
    const [updatedProposal] = await db
      .update(proposals)
      .set({
        votesFor,
        votesAgainst
      })
      .where(eq(proposals.id, id))
      .returning();

    if (!updatedProposal) {
      throw new Error(`Proposal with id ${id} not found`);
    }

    return updatedProposal;
  }

  async closeProposal(id: number): Promise<Proposal> {
    const [updatedProposal] = await db
      .update(proposals)
      .set({
        status: "completed"
      })
      .where(eq(proposals.id, id))
      .returning();

    if (!updatedProposal) {
      throw new Error(`Proposal with id ${id} not found`);
    }

    return updatedProposal;
  }

  // Vote operations
  async getVoteById(id: number): Promise<Vote | undefined> {
    const [vote] = await db.select().from(votes).where(eq(votes.id, id));
    return vote;
  }

  async getVotesByProposal(proposalId: number): Promise<Vote[]> {
    return await db
      .select()
      .from(votes)
      .where(eq(votes.proposalId, proposalId));
  }

  async getVotesByVoter(voterAddress: string): Promise<Vote[]> {
    const allVotes = await db.select().from(votes);
    return allVotes.filter(vote => vote.voterAddress.toLowerCase() === voterAddress.toLowerCase());
  }

  async createVote(insertVote: InsertVote): Promise<Vote> {
    const [vote] = await db
      .insert(votes)
      .values(insertVote)
      .returning();

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
    const allVotes = await db.select().from(votes);
    const vote = allVotes.find(vote => 
      vote.proposalId === proposalId && 
      vote.voterAddress.toLowerCase() === voterAddress.toLowerCase()
    );
    return !!vote;
  }
}

export const storage = new DatabaseStorage();
