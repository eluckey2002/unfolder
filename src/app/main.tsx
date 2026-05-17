/**
 * React root mount — replaces the imperative DOM bootstrap in the
 * pre-v4 main.ts. Single #root mount point; App composes the panes.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.js";

const root = document.getElementById("root");
if (!(root instanceof HTMLElement)) {
  throw new Error("main.tsx: #root element not found.");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
