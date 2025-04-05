import React from "react";
import { Button } from "@/components/ui/button";
import { useWallet, shortenAddress } from "@/lib/web3.tsx";
import { 
  Wallet, 
  ChevronDown, 
  AlertTriangle, 
  LogOut, 
  RotateCw,
  CheckCircle2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_NETWORK, NETWORKS } from "@/lib/networks";
import { Badge } from "@/components/ui/badge";

const ConnectButton: React.FC = () => {
  const { 
    account, 
    isConnected, 
    isConnecting, 
    connectWallet, 
    disconnectWallet,
    chainId,
    networkName,
    isNetworkSupported,
    switchNetwork,
    walletType
  } = useWallet();

  if (isConnecting) {
    return (
      <Button disabled className="flex items-center">
        <RotateCw className="w-4 h-4 mr-2 animate-spin" />
        <span>Connecting...</span>
      </Button>
    );
  }

  if (isConnected && account) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={isNetworkSupported ? "outline" : "destructive"}
            className="flex items-center"
          >
            <span className={`w-3 h-3 ${isNetworkSupported ? 'bg-green-500' : 'bg-yellow-400'} rounded-full mr-2`}></span>
            <span className="truncate max-w-[120px]">
              {shortenAddress(account)}
            </span>
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col">
            <span>Connected Account</span>
            <span className="text-xs text-muted-foreground mt-1">{account}</span>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Network</span>
            <Badge 
              variant={isNetworkSupported ? "outline" : "destructive"}
              className="ml-2"
            >
              {networkName}
            </Badge>
          </DropdownMenuLabel>
          
          {!isNetworkSupported && (
            <DropdownMenuItem className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Unsupported Network</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel>Switch Network</DropdownMenuLabel>
          
          {Object.values(NETWORKS).map((network) => (
            <DropdownMenuItem 
              key={network.chainId}
              onClick={() => switchNetwork(network.chainId)}
              disabled={network.chainId === chainId}
              className="flex justify-between items-center"
            >
              <span>{network.name}</span>
              {network.chainId === chainId && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={disconnectWallet}
            className="text-destructive flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button className="flex items-center" onClick={connectWallet}>
      <Wallet className="w-5 h-5 mr-2" />
      Connect Wallet
    </Button>
  );
};

export default ConnectButton;
