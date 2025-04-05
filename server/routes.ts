import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTokenSchema, insertProposalSchema, insertVoteSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handling middleware
  const handleError = (err: any, res: any) => {
    console.error(err);
    if (err instanceof ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: err.errors 
      });
    }
    return res.status(500).json({ message: err.message || "Internal server error" });
  };

  // Token routes
  app.get("/api/tokens", async (req, res) => {
    try {
      const tokens = await storage.getAllTokens();
      res.json(tokens);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Handle both query param and URL param versions
  app.get("/api/tokens/creator", async (req, res) => {
    try {
      // Get the address from query parameters
      const address = req.query.address;
      if (!address || typeof address !== 'string') {
        return res.status(400).json({ message: "Address is required as a string parameter" });
      }
      console.log("Fetching tokens for creator:", address);
      const tokens = await storage.getTokensByCreator(address);
      res.json(tokens);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/tokens/creator/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const tokens = await storage.getTokensByCreator(address);
      res.json(tokens);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/tokens", async (req, res) => {
    try {
      const tokenData = insertTokenSchema.parse(req.body);
      const token = await storage.createToken(tokenData);
      res.status(201).json(token);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Proposal routes
  app.get("/api/proposals", async (req, res) => {
    try {
      const proposals = await storage.getAllProposals();
      res.json(proposals);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/proposals/active", async (req, res) => {
    try {
      const proposals = await storage.getActiveProposals();
      res.json(proposals);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/proposals/token/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const proposals = await storage.getProposalsByToken(address);
      res.json(proposals);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/proposals/creator/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const proposals = await storage.getProposalsByCreator(address);
      res.json(proposals);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/proposals", async (req, res) => {
    try {
      const proposalData = insertProposalSchema.parse(req.body);
      const proposal = await storage.createProposal(proposalData);
      res.status(201).json(proposal);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/proposals/:id/close", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const proposal = await storage.closeProposal(id);
      res.json(proposal);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Vote routes
  app.get("/api/votes/proposal/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const votes = await storage.getVotesByProposal(id);
      res.json(votes);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/votes/voter/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const votes = await storage.getVotesByVoter(address);
      res.json(votes);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/votes/check/:proposalId/:voterAddress", async (req, res) => {
    try {
      const proposalId = parseInt(req.params.proposalId);
      const { voterAddress } = req.params;
      const hasVoted = await storage.hasVoted(proposalId, voterAddress);
      res.json({ hasVoted });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/votes", async (req, res) => {
    try {
      const voteData = insertVoteSchema.parse(req.body);
      
      // Check if user has already voted
      const hasVoted = await storage.hasVoted(voteData.proposalId, voteData.voterAddress);
      if (hasVoted) {
        return res.status(400).json({ message: "User has already voted on this proposal" });
      }
      
      // Get the proposal to check the token address
      const proposal = await storage.getProposalById(voteData.proposalId);
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      // In a real implementation, we would verify the token balance on-chain
      // For this demo, we'll just create the vote without verification
      // as the frontend already does the token balance check
      
      const vote = await storage.createVote(voteData);
      
      // Update the proposal's vote counts
      const votesFor = voteData.voteDirection === "for"
        ? (BigInt(proposal.votesFor) + BigInt(voteData.voteAmount)).toString()
        : proposal.votesFor;
        
      const votesAgainst = voteData.voteDirection === "against"
        ? (BigInt(proposal.votesAgainst) + BigInt(voteData.voteAmount)).toString()
        : proposal.votesAgainst;
      
      await storage.updateProposalVotes(proposal.id, votesFor, votesAgainst);
      
      res.status(201).json(vote);
    } catch (err) {
      handleError(err, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
