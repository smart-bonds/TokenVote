import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address").notNull().unique(),
});

export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  totalSupply: text("total_supply").notNull(),
  decimals: integer("decimals").notNull().default(18),
  contractAddress: text("contract_address").notNull(),
  creatorAddress: text("creator_address").notNull(),
  isTransferable: boolean("is_transferable").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  creatorAddress: text("creator_address").notNull(),
  tokenAddress: text("token_address").notNull(),
  tokenSymbol: text("token_symbol").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  quorum: integer("quorum").notNull().default(25), // as percentage
  votesFor: text("votes_for").notNull().default("0"),
  votesAgainst: text("votes_against").notNull().default("0"),
  status: text("status").notNull().default("active"), // active, completed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").notNull(),
  voterAddress: text("voter_address").notNull(),
  voteAmount: text("vote_amount").notNull(),
  voteDirection: text("vote_direction").notNull(), // for, against
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
});

export const insertTokenSchema = createInsertSchema(tokens).omit({
  id: true,
  createdAt: true,
});

export const insertProposalSchema = createInsertSchema(proposals)
  .omit({
    id: true,
    votesFor: true,
    votesAgainst: true,
    status: true,
    createdAt: true,
  })
  .extend({
    // Ensure dates can be parsed from string format
    startDate: z.string().or(z.date()).transform((val) => 
      typeof val === 'string' ? new Date(val) : val
    ),
    endDate: z.string().or(z.date()).transform((val) => 
      typeof val === 'string' ? new Date(val) : val
    ),
  });

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  timestamp: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertToken = z.infer<typeof insertTokenSchema>;
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type InsertVote = z.infer<typeof insertVoteSchema>;

export type User = typeof users.$inferSelect;
export type Token = typeof tokens.$inferSelect;
export type Proposal = typeof proposals.$inferSelect;
export type Vote = typeof votes.$inferSelect;
