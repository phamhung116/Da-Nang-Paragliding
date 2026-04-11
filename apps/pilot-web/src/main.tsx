import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "leaflet/dist/leaflet.css";
import "../../../packages/ui/src/theme/tokens.css";
import "@/app/styles/global.css";
import { AppRouter } from "@/app/router";
import { PilotAuthProvider } from "@/app/providers/auth-provider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <PilotAuthProvider>
          <AppRouter />
        </PilotAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
