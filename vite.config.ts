import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Force a single instance of React and three for both the app and
  // every transient dep (r3f, drei, etc.). Without this, pnpm's
  // strict-isolated layout produces duplicated copies — surfaces as
  // "Invalid hook call" + "Multiple instances of Three.js".
  resolve: {
    dedupe: ["react", "react-dom", "three"],
  },
  test: {
    // jsdom required for RTL component tests in src/**/*.test.tsx.
    // The pre-v4 Vitest config used "node" because every test in
    // test/** ran headless on the pure pipeline — that still works
    // under jsdom, no test rewrites needed.
    environment: "jsdom",
    // Cover both the existing pipeline tests (test/**) and the new
    // app-shell component tests (src/**).
    include: ["test/**/*.test.ts", "src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
