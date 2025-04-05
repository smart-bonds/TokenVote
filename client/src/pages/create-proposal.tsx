import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ProposalForm from "@/components/proposals/proposal-form";
import { useWallet } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Token } from "@shared/schema";

const CreateProposal: React.FC = () => {
  const { account, isConnected } = useWallet();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();

  // Fetch user's tokens for proposal creation
  const { data: tokens = [] } = useQuery<Token[]>({
    queryKey: [account ? "/api/tokens/creator" : "", account || ""],
    enabled: !!account,
  });

  const handleSubmit = async (values: any) => {
    try {
      if (!isConnected || !account) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet first",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);

      // Find selected token to get symbol
      const selectedToken = tokens.find(
        (token: Token) => token.contractAddress === values.tokenAddress
      );

      if (!selectedToken) {
        throw new Error("Selected token not found");
      }

      // Create proposal in our backend
      await apiRequest("POST", "/api/proposals", {
        title: values.title,
        description: values.description,
        creatorAddress: account,
        tokenAddress: values.tokenAddress,
        tokenSymbol: selectedToken.symbol,
        startDate: new Date(),
        endDate: values.endDate,
        quorum: parseInt(values.quorum),
      });

      // Show success toast
      toast({
        title: "Proposal created successfully",
        description: "Your proposal has been created and is now active",
      });

      // Invalidate proposals query
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals/active"] });

      // Redirect to proposals page
      setTimeout(() => {
        setLocation("/proposals");
      }, 1000);
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast({
        title: "Failed to create proposal",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="py-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold font-heading mb-8">Create a Proposal</h2>
          
          {!isConnected ? (
            <div className="text-center py-12 bg-background rounded-xl border border-border shadow-sm">
              <p className="text-muted-foreground mb-4">
                Connect your wallet to create a new proposal
              </p>
            </div>
          ) : (
            <ProposalForm 
              tokens={tokens}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default CreateProposal;
