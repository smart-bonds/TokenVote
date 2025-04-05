import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Proposal } from "@shared/schema";
import { ethers } from "ethers";
import { useWallet, shortenAddress } from "@/lib/web3.tsx";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface ProposalCardProps {
  proposal: Proposal;
  hasVoted: boolean;
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal, hasVoted }) => {
  const { account, signer } = useWallet();
  const { toast } = useToast();
  const [isVoting, setIsVoting] = useState(false);
  const [localHasVoted, setLocalHasVoted] = useState(hasVoted);

  // Calculate vote percentages and total votes
  const votesFor = BigInt(proposal.votesFor);
  const votesAgainst = BigInt(proposal.votesAgainst);
  const totalVotes = votesFor + votesAgainst;
  
  const votesForPercentage = totalVotes > 0 
    ? Number((votesFor * BigInt(100)) / totalVotes) 
    : 0;
  
  const votesAgainstPercentage = totalVotes > 0 
    ? Number((votesAgainst * BigInt(100)) / totalVotes) 
    : 0;

  // Format votes with token decimals (assuming 18 decimals for display)
  const formatVotes = (votes: string) => {
    try {
      return `${Number(ethers.formatUnits(votes, 18)).toLocaleString()} votes`;
    } catch (error) {
      return votes;
    }
  };

  // Format date and calculate days remaining
  const now = new Date();
  const endDate = new Date(proposal.endDate);
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  
  const isActive = proposal.status === "active" && endDate > now;
  const statusText = isActive 
    ? `Ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}` 
    : "Completed";

  // Calculate quorum progress
  const totalSupply = "1000000000000000000000000"; // Mock total supply for display purposes
  const quorumPercentage = proposal.quorum; // e.g., 25
  const quorumThreshold = (BigInt(totalSupply) * BigInt(quorumPercentage)) / BigInt(100);
  const quorumProgress = totalVotes > 0 && quorumThreshold > 0
    ? Math.min(100, Number((totalVotes * BigInt(100)) / quorumThreshold))
    : 0;

  const handleVote = async (direction: "for" | "against") => {
    try {
      if (!account || !signer) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to vote",
          variant: "destructive",
        });
        return;
      }

      if (localHasVoted) {
        toast({
          title: "Already voted",
          description: "You have already voted on this proposal",
          variant: "destructive",
        });
        return;
      }

      setIsVoting(true);

      // In a real implementation, we would sign a transaction to vote on-chain
      // For this demo, we'll just call our API
      const voteAmount = "1000000000000000000"; // 1 token with 18 decimals
      
      await apiRequest("POST", "/api/votes", {
        proposalId: proposal.id,
        voterAddress: account,
        voteAmount,
        voteDirection: direction,
      });

      toast({
        title: "Vote submitted",
        description: `You voted ${direction} the proposal`,
      });

      setLocalHasVoted(true);
      
      // Invalidate proposals query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals/active"] });
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Failed to vote",
        description: error instanceof Error ? error.message : "An error occurred while voting",
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-wrap justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={isActive ? "secondary" : "outline"}>
                {isActive ? "Active" : "Completed"}
              </Badge>
              <span className="text-sm text-muted-foreground">{statusText}</span>
            </div>
            <h3 className="text-xl font-bold font-heading">{proposal.title}</h3>
            <div className="text-sm text-muted-foreground mt-1">
              By <span className="text-primary">{shortenAddress(proposal.creatorAddress)}</span> · 
              Using <span className="font-medium">{proposal.tokenSymbol}</span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="text-sm text-muted-foreground mb-1">Quorum: {proposal.quorum}%</div>
            <div className="w-32 h-2 rounded-full overflow-hidden">
              <Progress value={quorumProgress} className="h-full" />
            </div>
          </div>
        </div>

        <div className="mb-6 text-foreground">
          <p>{proposal.description}</p>
        </div>

        <div className="space-y-3 mb-6">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">For</span>
              <span className="text-sm font-medium">{votesForPercentage}% ({formatVotes(proposal.votesFor)})</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${votesForPercentage}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Against</span>
              <span className="text-sm font-medium">{votesAgainstPercentage}% ({formatVotes(proposal.votesAgainst)})</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-destructive rounded-full"
                style={{ width: `${votesAgainstPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {isActive && !localHasVoted && (
            <>
              <Button
                onClick={() => handleVote("for")}
                disabled={isVoting}
              >
                {isVoting ? "Voting..." : "Vote For"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleVote("against")}
                disabled={isVoting}
                className="text-foreground"
              >
                Vote Against
              </Button>
            </>
          )}
          {localHasVoted && (
            <Badge variant="outline" className="mr-auto">
              You voted on this proposal
            </Badge>
          )}
          <span className="ml-auto">
            <Button
              variant="outline"
              className="text-foreground"
            >
              View Details
            </Button>
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProposalCard;
