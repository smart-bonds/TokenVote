import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProposalCard from "@/components/proposals/proposal-card";
import ProposalFilter from "@/components/proposals/proposal-filter";
import { useWallet } from "@/lib/web3.tsx";
import { type Proposal } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const Proposals: React.FC = () => {
  const { account, isConnected } = useWallet();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [votedProposals, setVotedProposals] = useState<number[]>([]);

  // Fetch proposals based on filter
  const { data: proposals, isLoading } = useQuery({
    queryKey: activeFilter === "active" ? ["/api/proposals/active"] : ["/api/proposals"],
    enabled: true,
  });

  // Fetch user votes
  const { data: userVotes, isLoading: isLoadingVotes } = useQuery({
    queryKey: account ? ["/api/votes/voter", account] : [""],
    enabled: !!account,
  });

  // Build list of proposal IDs the user has voted on
  useEffect(() => {
    if (userVotes && Array.isArray(userVotes)) {
      const votedIds = userVotes.map((vote) => vote.proposalId);
      // Create unique array without using Set
      const uniqueIds: number[] = [];
      votedIds.forEach(id => {
        if (!uniqueIds.includes(id)) {
          uniqueIds.push(id);
        }
      });
      setVotedProposals(uniqueIds);
    }
  }, [userVotes]);

  // Filter and search proposals
  const filteredProposals = React.useMemo(() => {
    if (!proposals || !Array.isArray(proposals)) return [];
    
    let filtered = Array.isArray(proposals) ? [...proposals] : [];
    
    // Apply filter
    if (activeFilter === "active") {
      // Already filtered by API
    } else if (activeFilter === "completed") {
      filtered = filtered.filter(
        (p) => p.status === "completed" || new Date(p.endDate) < new Date()
      );
    } else if (activeFilter === "my-votes" && votedProposals.length > 0) {
      filtered = filtered.filter((p) => votedProposals.includes(p.id));
    }
    
    // Apply search
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [proposals, activeFilter, searchTerm, votedProposals]);

  // Check if user has voted on a proposal
  const hasUserVoted = (proposalId: number) => {
    return votedProposals.includes(proposalId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold font-heading">Active Proposals</h2>
          <Link href="/create-proposal">
            <div className="cursor-pointer">
              <Button variant="link" className="text-primary flex items-center">
                <Plus className="w-5 h-5 mr-1" />
                Create Proposal
              </Button>
            </div>
          </Link>
        </div>

        <ProposalFilter
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {isLoading || isLoadingVotes ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : filteredProposals.length > 0 ? (
          <div className="space-y-6">
            {filteredProposals.map((proposal: Proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                hasVoted={hasUserVoted(proposal.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? "No proposals match your search"
                : activeFilter === "my-votes"
                ? "You haven't voted on any proposals yet"
                : "No proposals found"}
            </p>
            <Link href="/create-proposal">
              <div className="cursor-pointer">
                <Button>Create a New Proposal</Button>
              </div>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default Proposals;
