import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    css: true,
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/dist/**", "**/*.spec.ts"],
    globals: true,
    setupFiles: [fileURLToPath(new URL("./src/test/setup.ts", import.meta.url))],
    testTimeout: 10_000,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  root: fileURLToPath(new URL(".", import.meta.url)),
});
