import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Apply custom CSS for fonts
const style = document.createElement('style');
style.textContent = `
  :root {
    --primary: 258 100% 66%;
    --primary-foreground: 0 0% 100%;
    
    --secondary: 168 83% 52%;
    --secondary-foreground: 0 0% 10%;
    
    --background: 220 60% 99%;
    --foreground: 220 10% 11%;
    
    --accent: 317 100% 69%;
    --accent-foreground: 0 0% 100%;
    
    --chart-1: var(--primary);
    --chart-2: var(--secondary);
    --chart-3: var(--accent);
    --chart-4: 338 77% 48%;
    --chart-5: 20 84% 57%;
  }

  .dark {
    --background: 0 0% 7%;
    --foreground: 0 0% 96%;
    
    --card: 0 0% 14%;
    --card-foreground: 0 0% 96%;
    
    --popover: 0 0% 14%;
    --popover-foreground: 0 0% 96%;
    
    --primary: 258 100% 66%;
    --primary-foreground: 0 0% 100%;
    
    --secondary: 168 83% 52%;
    --secondary-foreground: 0 0% 10%;
    
    --accent: 317 100% 69%;
    --accent-foreground: 0 0% 100%;
    
    --muted: 0 0% 20%;
    --muted-foreground: 0 0% 70%;
    
    --border: 0 0% 20%;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: 'Inter', sans-serif;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Space Grotesk', sans-serif;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .pulse-animation {
    animation: pulse 1.5s infinite;
  }
`;

document.head.appendChild(style);

createRoot(document.getElementById("root")!).render(<App />);
