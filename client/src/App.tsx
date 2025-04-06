import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { WalletProvider } from "./lib/web3.tsx";
import Header from "./components/layout/header";
import Footer from "./components/layout/footer";
import NetworkCheck from "@/components/wallet/network-check";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Tokens from "@/pages/tokens";
import Proposals from "@/pages/proposals";
import CreateToken from "@/pages/create-token";
import CreateProposal from "@/pages/create-proposal";

function App() {
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") || "light"
  );

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <Header toggleTheme={toggleTheme} theme={theme} />
          <main className="flex-grow">
            <div className="container mx-auto px-4 pt-4">
              <NetworkCheck />
            </div>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/tokens" component={Tokens} />
              <Route path="/proposals" component={Proposals} />
              <Route path="/create-token" component={CreateToken} />
              <Route path="/create-proposal" component={CreateProposal} />
              <Route component={NotFound} />
            </Switch>
          </main>
          <Footer />
        </div>
        <Toaster />
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
