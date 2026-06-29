import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "core/index": "src/core/index.ts",
    "react/index": "src/react/index.ts",
    "ui/index": "src/ui/index.ts",
  },
  format: ["es"],
  dts: true,
  clean: true,
  treeshake: true,
  // Keep peer + runtime deps out of the bundle so consumers dedupe them.
  external: [/^react/, /^react-dom/, /^@radix-ui\//, "date-fns", "@date-fns/tz", "rrule"],
});
