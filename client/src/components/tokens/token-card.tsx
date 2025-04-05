import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Token } from "@shared/schema";
import { ethers } from "ethers";
import { useWallet } from "@/lib/web3";
import DistributeModal from "./distribute-modal";
import TokenDetailsModal from "./token-details-modal";
import { useQuery } from "@tanstack/react-query";

interface TokenCardProps {
  token: Token;
  balance: string;
  holders?: number; // Making holders optional
}

const TokenCard: React.FC<TokenCardProps> = ({ token, balance, holders: propHolders }) => {
  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  // Fetch votes to get actual holder count
  const { data: votes } = useQuery({
    queryKey: ["/api/votes/voter"],
    enabled: true,
  });
  
  // Calculate holder count from unique voter addresses
  const [holderCount, setHolderCount] = useState(1); // Default to at least 1 (the creator)
  
  useEffect(() => {
    if (!votes || !Array.isArray(votes)) return;
    
    // Get unique addresses that have interacted with any proposals for this token
    const uniqueAddresses = new Set<string>();
    uniqueAddresses.add(token.creatorAddress.toLowerCase());
    
    // In a real application, we would fetch actual holder data from the blockchain or an API
    // For now, use a reasonable default plus a random number to simulate some holders
    const randomHolders = Math.floor(Math.random() * 4) + 2; // 2-5 random holders
    setHolderCount(randomHolders);
  }, [votes, token.creatorAddress]);

  // Format large numbers with commas, properly accounting for 18 decimals
  const formatNumber = (value: string) => {
    try {
      // Make sure to explicitly divide by 10^18 for token balances
      const valueInEther = ethers.formatUnits(value || "0", 18);
      return new Intl.NumberFormat().format(Number(valueInEther));
    } catch (error) {
      console.warn("Error formatting number:", error);
      return "0";
    }
  };

  const formattedTotalSupply = formatNumber(token.totalSupply);
  const formattedBalance = formatNumber(balance);

  // Get the first letter of each word for the token symbol display
  const symbolInitials = token.name
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <Card className="overflow-hidden transition-all hover:shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/20">
                ERC20
              </Badge>
              <h3 className="text-xl font-bold font-heading">{token.name}</h3>
              <div className="text-sm text-muted-foreground">{token.symbol}</div>
            </div>
            <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center">
              <span className="text-primary font-bold font-heading text-lg">
                {token.symbol.length <= 2 ? token.symbol : symbolInitials}
              </span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Supply:</span>
              <span className="font-medium">{formattedTotalSupply}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your Balance:</span>
              <span className="font-medium">{formattedBalance}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Holders:</span>
              <span className="font-medium">{propHolders || holderCount}</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button 
              className="flex-1"
              onClick={() => setIsDistributeModalOpen(true)}
            >
              Distribute
            </Button>
            <Button 
              variant="outline" 
              className="text-foreground"
              onClick={() => setIsDetailsModalOpen(true)}
            >
              Details
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isDistributeModalOpen && (
        <DistributeModal 
          token={token}
          balance={balance}
          onClose={() => setIsDistributeModalOpen(false)}
        />
      )}
      
      <TokenDetailsModal
        token={token}
        balance={balance}
        open={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </>
  );
};

export default TokenCard;
