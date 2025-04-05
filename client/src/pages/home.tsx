import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWallet } from "@/lib/web3.tsx";

const Home: React.FC = () => {
  const { isConnected } = useWallet();

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
          Create <span className="text-primary">Tokens</span> and{" "}
          <span className="text-accent">Vote</span> on Proposals
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto text-muted-foreground mb-8">
          Launch custom ERC20 tokens and use them for decentralized governance on the blockchain
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link href="/create-token">
            <a>
              <Button size="lg" className="font-heading">
                Create a Token
              </Button>
            </a>
          </Link>
          <Link href="/proposals">
            <a>
              <Button variant="outline" size="lg" className="font-heading text-foreground">
                Browse Proposals
              </Button>
            </a>
          </Link>
        </div>

        <Card className="relative w-full max-w-4xl mx-auto overflow-hidden shadow-lg">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary"></div>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 justify-around">
              <StatsCard value="128" label="Active Tokens" color="text-primary" />
              <StatsCard value="57" label="Open Proposals" color="text-accent" />
              <StatsCard value="4.2K" label="Total Votes" color="text-secondary" />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

interface StatsCardProps {
  value: string;
  label: string;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ value, label, color }) => {
  return (
    <div className="flex flex-col items-center">
      <div className={`text-4xl font-bold font-heading ${color}`}>
        {value}
      </div>
      <div className="text-muted-foreground">
        {label}
      </div>
    </div>
  );
};

export default Home;
