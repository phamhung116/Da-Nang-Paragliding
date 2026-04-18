import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@paragliding/ui": resolve(__dirname, "../../packages/ui/src"),
      "@paragliding/api-client": resolve(__dirname, "../../packages/api-client/src")
    }
  },
  server: {
    port: 5173
  }
});
