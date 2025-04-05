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
import { ExternalLink, Copy } from "lucide-react";
import { type Token } from "@shared/schema";
import { ethers } from "ethers";
import { shortenAddress } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";

interface TokenDetailsModalProps {
  token: Token;
  balance: string;
  open: boolean;
  onClose: () => void;
}

const TokenDetailsModal: React.FC<TokenDetailsModalProps> = ({ 
  token, 
  balance, 
  open, 
  onClose 
}) => {
  const { toast } = useToast();

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

  const explorerBaseUrl = "https://alfajores.celoscan.io";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} copied!`,
      description: "The value has been copied to your clipboard.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading flex items-center gap-2">
            {token.name}
            <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/20">
              ERC20
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-base font-medium">
            {token.symbol}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Contract Address</div>
            <div className="flex items-center space-x-2">
              <code className="bg-muted px-2 py-1 rounded text-sm overflow-hidden overflow-ellipsis">
                {token.contractAddress}
              </code>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => copyToClipboard(token.contractAddress, "Contract address")}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => window.open(`${explorerBaseUrl}/address/${token.contractAddress}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Supply</div>
              <div className="font-medium">{formattedTotalSupply} {token.symbol}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Your Balance</div>
              <div className="font-medium">{formattedBalance} {token.symbol}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Decimals</div>
              <div className="font-medium">{token.decimals}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Transferable</div>
              <div className="font-medium">{token.isTransferable ? "Yes" : "No"}</div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Creator Address</div>
            <div className="flex items-center space-x-2">
              <code className="bg-muted px-2 py-1 rounded text-sm">
                {shortenAddress(token.creatorAddress)}
              </code>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => copyToClipboard(token.creatorAddress, "Creator address")}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => window.open(`${explorerBaseUrl}/address/${token.creatorAddress}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Creation Date</div>
            <div className="font-medium">
              {new Date(token.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => window.open(`${explorerBaseUrl}/token/${token.contractAddress}`, '_blank')}>
            View on Explorer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TokenDetailsModal;