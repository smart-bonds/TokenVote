import React, { useState } from "react";
import { useLocation } from "wouter";
import TokenForm from "@/components/tokens/token-form";
import { useWallet } from "@/lib/web3.tsx";
import { useToast } from "@/hooks/use-toast";
import { createToken } from "@/lib/contracts";
import { ethers } from "ethers";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

const CreateToken: React.FC = () => {
  const { signer, account, isConnected } = useWallet();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | undefined>();
  const [, setLocation] = useLocation();

  const handleSubmit = async (values: any) => {
    try {
      if (!isConnected || !signer || !account) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet first",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);

      // Convert values to proper format
      const decimals = parseInt(values.tokenDecimals);
      const initialSupply = ethers.parseUnits(values.tokenSupply, decimals).toString();

      // Create token on blockchain (simulated in this demo)
      const tokenAddress = await createToken(
        signer,
        values.tokenName,
        values.tokenSymbol,
        initialSupply,
        decimals,
        values.tokenTransferable
      );

      // Save token transaction hash
      setTransactionHash(tokenAddress);
      
      // Save token in our backend
      await apiRequest("POST", "/api/tokens", {
        name: values.tokenName,
        symbol: values.tokenSymbol,
        totalSupply: initialSupply,
        decimals,
        contractAddress: tokenAddress,
        creatorAddress: account,
        isTransferable: values.tokenTransferable,
      });

      // Show success toast
      toast({
        title: "Token created successfully",
        description: `Your ${values.tokenName} (${values.tokenSymbol}) token has been created`,
      });

      // Invalidate tokens query
      queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tokens/creator", account] });

      // Redirect to tokens page
      setTimeout(() => {
        setLocation("/tokens");
      }, 2000);
    } catch (error) {
      console.error("Error creating token:", error);
      toast({
        title: "Failed to create token",
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
          <h2 className="text-3xl font-bold font-heading mb-8">Create a Token</h2>
          
          {!isConnected ? (
            <div className="text-center py-12 bg-background rounded-xl border border-border shadow-sm">
              <p className="text-muted-foreground mb-4">
                Connect your wallet to create a new token
              </p>
            </div>
          ) : (
            <TokenForm 
              onSubmit={handleSubmit} 
              isSubmitting={isSubmitting} 
              transactionHash={transactionHash}
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default CreateToken;
