import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config for the Stem Splitter frontend.
// Proxies /api requests to the FastAPI backend on localhost:8000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true
      }
    }
  }
});

