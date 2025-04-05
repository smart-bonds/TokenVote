import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Copy, Check, X, Clock } from "lucide-react";
import { type Proposal } from "@shared/schema";
import { ethers } from "ethers";
import { shortenAddress } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface ProposalDetailsModalProps {
  proposal: Proposal;
  open: boolean;
  onClose: () => void;
  hasVoted: boolean;
  onVote?: (direction: "for" | "against") => Promise<void>;
  isVoting?: boolean;
}

const ProposalDetailsModal: React.FC<ProposalDetailsModalProps> = ({ 
  proposal, 
  open, 
  onClose,
  hasVoted,
  onVote,
  isVoting = false
}) => {
  const { toast } = useToast();

  // Format votes with token decimals
  const formatVotes = (votes: string) => {
    try {
      return `${Number(ethers.formatUnits(votes, 18)).toLocaleString()} votes`;
    } catch (error) {
      return votes;
    }
  };

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

  // Format date and calculate days remaining
  const now = new Date();
  const startDate = new Date(proposal.startDate);
  const endDate = new Date(proposal.endDate);
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  
  const isActive = proposal.status === "active" && endDate > now;
  const statusText = isActive 
    ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining` 
    : "Completed";

  // Calculate quorum progress
  const totalSupply = "1000000000000000000000000"; // Mock total supply for display purposes
  const quorumPercentage = proposal.quorum; // e.g., 25
  const quorumThreshold = (BigInt(totalSupply) * BigInt(quorumPercentage)) / BigInt(100);
  const quorumProgress = totalVotes > 0 && quorumThreshold > 0
    ? Math.min(100, Number((totalVotes * BigInt(100)) / quorumThreshold))
    : 0;

  // Result display
  const result = votesFor > votesAgainst ? "Passed" : "Rejected";
  const resultClass = votesFor > votesAgainst ? "text-green-600" : "text-red-600";

  const explorerBaseUrl = "https://alfajores.celoscan.io";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} copied!`,
      description: "The value has been copied to your clipboard.",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-2xl font-heading">
              {proposal.title}
            </DialogTitle>
            <Badge variant={isActive ? "secondary" : "outline"}>
              {isActive ? "Active" : "Completed"}
            </Badge>
            {!isActive && (
              <Badge variant={votesFor > votesAgainst ? "default" : "destructive"}>
                {result}
              </Badge>
            )}
          </div>
          <DialogDescription className="text-base mt-2">
            Proposal by {shortenAddress(proposal.creatorAddress)} using {proposal.tokenSymbol} token
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Description</div>
            <p className="text-foreground">{proposal.description}</p>
          </div>

          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Voting Token</div>
              <div className="font-medium flex items-center">
                {proposal.tokenSymbol}
                <span className="text-xs text-muted-foreground ml-2">
                  ({proposal.tokenAddress.substring(0, 6)}...{proposal.tokenAddress.substring(38)})
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Quorum Required</div>
              <div className="font-medium">{proposal.quorum}%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Start Date</div>
              <div className="font-medium">{formatDate(startDate)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">End Date</div>
              <div className="font-medium">{formatDate(endDate)}</div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">Quorum Progress</div>
              <div className="text-sm text-muted-foreground">
                {quorumProgress}% of {proposal.quorum}% required
              </div>
            </div>
            <Progress value={quorumProgress} className="h-2" />
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">For</span>
                  </div>
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
                  <div className="flex items-center gap-1">
                    <X className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">Against</span>
                  </div>
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
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{statusText}</span>
            </div>
            {hasVoted && (
              <Badge variant="outline">
                You voted on this proposal
              </Badge>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isActive && !hasVoted && onVote && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => onVote("for")}
                disabled={isVoting}
                className="flex-1"
              >
                {isVoting ? "Voting..." : "Vote For"}
              </Button>
              <Button
                variant="outline"
                onClick={() => onVote("against")}
                disabled={isVoting}
                className="text-foreground flex-1"
              >
                Vote Against
              </Button>
            </div>
          )}
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="ml-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProposalDetailsModal;