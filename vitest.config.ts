import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "core",
          environment: "node",
          include: ["packages/calendar/src/core/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "react",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
          include: ["packages/calendar/src/react/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
});
