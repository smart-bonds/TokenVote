import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  tokenName: z.string().min(2, {
    message: "Token name must be at least 2 characters.",
  }),
  tokenSymbol: z.string().min(1, {
    message: "Token symbol must be at least 1 character.",
  }).max(5, {
    message: "Token symbol must be at most 5 characters.",
  }),
  tokenSupply: z.string().min(1, {
    message: "Initial supply is required.",
  }).refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Initial supply must be a positive number.",
  }),
  tokenDecimals: z.string(),
  tokenTransferable: z.boolean().default(true),
});

interface TokenFormProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  isSubmitting: boolean;
  transactionHash?: string;
}

const TokenForm: React.FC<TokenFormProps> = ({ 
  onSubmit, 
  isSubmitting,
  transactionHash
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tokenName: "",
      tokenSymbol: "",
      tokenSupply: "",
      tokenDecimals: "18",
      tokenTransferable: true,
    },
  });

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="tokenName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Governance Token"
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
              name="tokenSymbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Symbol</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. GOV (3-5 characters)"
                      {...field}
                      disabled={isSubmitting}
                      maxLength={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tokenSupply"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Supply</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 1000000"
                      {...field}
                      disabled={isSubmitting}
                      min="1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tokenDecimals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Decimals</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select decimals" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="18">18 (Default)</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="9">9</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tokenTransferable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Tokens are transferable between wallets
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="font-heading"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Token..." : "Create Token"}
              </Button>
            </div>

            {isSubmitting && (
              <div className="transaction-status">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="pulse-animation mr-3">
                      <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                    </div>
                    <span className="font-medium">Transaction in Progress</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your token is being created. Please wait and don't close this window.
                  </p>
                  {transactionHash && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      Transaction hash:{" "}
                      <a
                        href={`https://etherscan.io/tx/${transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary"
                      >
                        {transactionHash.substring(0, 6)}...
                        {transactionHash.substring(transactionHash.length - 4)}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TokenForm;
