import React from "react";
import { useWallet } from "@/lib/web3";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_NETWORK, isTestnet } from "@/lib/networks";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface NetworkIndicatorProps {
  className?: string;
  showSwitchButton?: boolean;
}

const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({
  className = "",
  showSwitchButton = false,
}) => {
  const wallet = useWallet();
  
  if (!wallet.isConnected) {
    return null;
  }

  // Determine badge variant based on network status
  let badgeVariant: "outline" | "secondary" | "destructive" = "outline";
  let badgeIcon = <CheckCircle2 className="h-4 w-4 mr-1" />;
  
  if (!wallet.isNetworkSupported) {
    badgeVariant = "destructive";
    badgeIcon = <AlertTriangle className="h-4 w-4 mr-1" />;
  } else if (isTestnet(wallet.chainId)) {
    badgeVariant = "secondary";
  }

  const displayName = wallet.networkName || "Unknown Network";

  return (
    <div className={`flex items-center ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={badgeVariant} className="flex items-center px-2 py-1">
              {badgeIcon}
              {displayName}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {wallet.isNetworkSupported
                ? `Connected to ${displayName}`
                : `Unsupported network: ${displayName}`}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showSwitchButton && !wallet.isNetworkSupported && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-2 text-xs"
          onClick={() => wallet.switchNetwork(DEFAULT_NETWORK)}
        >
          <ArrowRight className="h-3 w-3 mr-1" />
          Switch Network
        </Button>
      )}
    </div>
  );
};

export default NetworkIndicator;