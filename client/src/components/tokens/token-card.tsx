import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Token } from "@shared/schema";
import { ethers } from "ethers";
import { useWallet } from "@/lib/web3";
import DistributeModal from "./distribute-modal";

interface TokenCardProps {
  token: Token;
  balance: string;
  holders: number;
}

const TokenCard: React.FC<TokenCardProps> = ({ token, balance, holders }) => {
  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);

  // Format large numbers with commas
  const formatNumber = (value: string) => {
    try {
      return new Intl.NumberFormat().format(
        Number(ethers.formatUnits(value, token.decimals))
      );
    } catch (error) {
      return value;
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
              <span className="font-medium">{holders}</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button 
              className="flex-1"
              onClick={() => setIsDistributeModalOpen(true)}
            >
              Distribute
            </Button>
            <Button variant="outline" className="text-foreground">
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
    </>
  );
};

export default TokenCard;
