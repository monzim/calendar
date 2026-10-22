import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const pkg = (p: string) => fileURLToPath(new URL(`../../packages/calendar/${p}`, import.meta.url));

const README = fileURLToPath(new URL("../../README.md", import.meta.url));

/**
 * Serve / emit `llms-full.txt` (the whole README, for AI coding agents) straight
 * from the repo README so it can never drift from the docs. `llms.txt`, the
 * short index, lives in public/.
 */
function llmsFullTxt(): Plugin {
  return {
    name: "llms-full-txt",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.endsWith("/llms-full.txt")) return next();
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end(readFileSync(README, "utf8"));
      });
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "llms-full.txt", source: readFileSync(README, "utf8") });
    },
  };
}

export default defineConfig({
  // GitHub Pages serves the demo from a subpath (monzim.github.io/calendar/).
  base: "/calendar/",
  plugins: [react(), tailwindcss(), llmsFullTxt()],
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
