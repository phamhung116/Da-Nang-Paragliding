import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../../../packages/ui/src/theme/tokens.css";
import "@/app/styles/global.css";
import { AppRouter } from "@/app/router";
import { AdminAuthProvider } from "@/app/providers/auth-provider";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AdminAuthProvider>
          <AppRouter />
        </AdminAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
