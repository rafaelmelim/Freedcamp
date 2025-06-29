import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

// Enhanced environment variable logging for debugging
console.log("🔧 Environment Configuration:")
console.log("  VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL || "❌ NOT SET")
console.log("  VITE_SUPABASE_ANON_KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY ? 
  `✅ SET (${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...)` : 
  "❌ NOT SET")

// Validate environment on startup
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error("🚨 CRITICAL: Missing Supabase environment variables!")
  console.error("Please ensure your .env file contains:")
  console.error("VITE_SUPABASE_URL=https://your-project-id.supabase.co")
  console.error("VITE_SUPABASE_ANON_KEY=your-anon-key-here")
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster position="top-right" />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);