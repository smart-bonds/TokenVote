import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ethers } from "ethers";
import { useWallet } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";
import { transferTokens } from "@/lib/contracts";
import { Token } from "@shared/schema";

const formSchema = z.object({
  recipientAddress: z
    .string()
    .min(42, {
      message: "Please enter a valid Ethereum address.",
    })
    .regex(/^0x[a-fA-F0-9]{40}$/, {
      message: "Please enter a valid Ethereum address.",
    }),
  tokenAmount: z
    .string()
    .min(1, {
      message: "Amount is required.",
    })
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a positive number.",
    }),
});

interface DistributeModalProps {
  token: Token;
  balance: string;
  onClose: () => void;
}

const DistributeModal: React.FC<DistributeModalProps> = ({ token, balance, onClose }) => {
  const { signer } = useWallet();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format balance for display, ensuring we use 18 decimals
  const formattedBalance = ethers.formatUnits(balance || "0", 18);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientAddress: "",
      tokenAmount: "",
    },
  });

  const handleMaxClick = () => {
    form.setValue("tokenAmount", formattedBalance);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!signer) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet first",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);

      // Convert amount to wei/tokens with explicit 18 decimals
      const parsedAmount = ethers.parseUnits(values.tokenAmount, 18).toString();

      // Check if amount is less than or equal to balance
      if (BigInt(parsedAmount) > BigInt(balance)) {
        toast({
          title: "Insufficient balance",
          description: "You don't have enough tokens",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Transfer tokens
      const txHash = await transferTokens(
        signer,
        token.contractAddress,
        values.recipientAddress,
        parsedAmount
      );

      toast({
        title: "Tokens transferred successfully",
        description: `Sent ${values.tokenAmount} ${token.symbol} to ${values.recipientAddress.substring(0, 6)}...${values.recipientAddress.substring(values.recipientAddress.length - 4)}`,
      });

      onClose();
    } catch (error) {
      console.error("Error transferring tokens:", error);
      toast({
        title: "Failed to transfer tokens",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-heading mb-2">Distribute Tokens</DialogTitle>
          <DialogDescription>
            Send <span className="font-medium text-primary">{token.name} ({token.symbol})</span> to another wallet address
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="recipientAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0x..."
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tokenAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="0.0"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="absolute right-3 top-2.5 text-gray-500 text-sm">
                      {token.symbol}
                    </div>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>Available: {parseFloat(formattedBalance).toLocaleString()} {token.symbol}</span>
                    <button
                      type="button"
                      className="text-primary"
                      onClick={handleMaxClick}
                    >
                      MAX
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="font-heading"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Tokens"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DistributeModal;
