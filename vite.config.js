import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The production build is served from https://0ri0n1.github.io/civicletter/
// (GitHub Pages project site), so assets need the /civicletter/ base path.
// Dev keeps "/" so localhost:5173 works unchanged.
export default defineConfig(({ command }) => ({
    plugins: [react()],
    base: command === "build" ? "/civicletter/" : "/",
}));
