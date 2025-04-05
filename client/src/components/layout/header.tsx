import React from "react";
import { Link, useLocation } from "wouter";
import Logo from "../ui/logo";
import ConnectButton from "../wallet/connect-button";
import { Moon, Sun } from "lucide-react";
import { Button } from "../ui/button";

interface HeaderProps {
  toggleTheme: () => void;
  theme: "light" | "dark";
}

const Header: React.FC<HeaderProps> = ({ toggleTheme, theme }) => {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex space-x-6">
            <NavLink href="/tokens" active={location === "/tokens"}>
              Tokens
            </NavLink>
            <NavLink href="/proposals" active={location === "/proposals"}>
              Proposals
            </NavLink>
            <NavLink href="/create-token" active={location === "/create-token"}>
              Create
            </NavLink>
          </nav>

          <Button
            onClick={toggleTheme}
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <ConnectButton />
        </div>
      </div>
    </header>
  );
};

interface NavLinkProps {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ href, active, children }) => {
  return (
    <Link href={href}>
      <span
        className={`font-medium transition-colors cursor-pointer ${
          active
            ? "text-primary"
            : "text-foreground hover:text-primary"
        }`}
      >
        {children}
      </span>
    </Link>
  );
};

export default Header;
