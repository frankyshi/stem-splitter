import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Basic Vite config for the Stem Splitter frontend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
});

