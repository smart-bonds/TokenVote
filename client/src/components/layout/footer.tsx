import React from "react";
import Logo from "../ui/logo";

const Footer: React.FC = () => {
  return (
    <footer className="bg-background border-t border-border py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Logo className="scale-75" />
          </div>

          <div className="flex space-x-6">
            <a
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Documentation
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              GitHub
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Community
            </a>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} TokenVote. All rights reserved. Not audited, use at your own risk.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
