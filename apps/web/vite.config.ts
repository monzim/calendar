import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const pkg = (p: string) => fileURLToPath(new URL(`../../packages/calendar/${p}`, import.meta.url));

export default defineConfig({
  // GitHub Pages serves the demo from a subpath (monzim.github.io/calendar/).
  base: "/calendar/",
  plugins: [react(), tailwindcss()],
  resolve: {
    // Dogfood the library straight from source (instant HMR on lib edits), while
    // the stylesheet still comes from the compiled artifact. Order matters:
    // subpath aliases must precede the bare-package alias.
    alias: [
      { find: "@monzim/calendar/styles.css", replacement: pkg("dist/styles.css") },
      { find: "@monzim/calendar/core", replacement: pkg("src/core/index.ts") },
      { find: "@monzim/calendar/react", replacement: pkg("src/react/index.ts") },
      { find: "@monzim/calendar/ui", replacement: pkg("src/ui/index.ts") },
      { find: "@monzim/calendar", replacement: pkg("src/index.ts") },
    ],
  },
});
