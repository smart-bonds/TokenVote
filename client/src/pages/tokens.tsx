import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TokenCard from "@/components/tokens/token-card";
import { useWallet } from "@/lib/web3.tsx";
import { type Token } from "@shared/schema";
import { getTokenBalance } from "@/lib/contracts";
import { Skeleton } from "@/components/ui/skeleton";

const Tokens: React.FC = () => {
  const { account, provider, isConnected } = useWallet();
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Fetch tokens created by the connected wallet
  const { data: tokens, isLoading } = useQuery({
    queryKey: account ? ["/api/tokens/creator", account] : ["/api/tokens"],
    enabled: isConnected,
  });

  // Load token balances
  useEffect(() => {
    const loadBalances = async () => {
      if (!tokens || !Array.isArray(tokens) || !provider || !account) return;
      
      setIsLoadingBalances(true);
      const balances: Record<string, string> = {};
      
      try {
        for (const token of tokens) {
          const balance = await getTokenBalance(provider, token.contractAddress, account);
          balances[token.contractAddress] = balance;
        }
        setTokenBalances(balances);
      } catch (error) {
        console.error("Error loading token balances:", error);
      } finally {
        setIsLoadingBalances(false);
      }
    };
    
    loadBalances();
  }, [tokens, provider, account]);

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold font-heading">My Tokens</h2>
          <Link href="/create-token">
            <span className="inline-block">
              <Button variant="link" className="text-primary flex items-center">
                <Plus className="w-5 h-5 mr-1" />
                Create New Token
              </Button>
            </span>
          </Link>
        </div>

        {!isConnected ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Connect your wallet to view your tokens
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : tokens && Array.isArray(tokens) && tokens.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(tokens as Token[]).map((token: Token) => (
              <TokenCard
                key={token.id}
                token={token}
                balance={tokenBalances[token.contractAddress] || "0"}
                holders={8} // Mock value for demo
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              You haven't created any tokens yet
            </p>
            <Link href="/create-token">
              <span className="inline-block">
                <Button>Create Your First Token</Button>
              </span>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default Tokens;
