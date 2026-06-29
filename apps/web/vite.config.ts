import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // GitHub Pages serves the demo from a subpath.
  base: "/GoogleCalendarWeekly/",
  plugins: [react(), tailwindcss()],
});
