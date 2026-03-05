import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  base: "/",
  build: {
    outDir: "dist",
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true
  }
});
