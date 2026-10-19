import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "spoiler-safe-context": new URL("../packages/spoiler-safe-context/src/index.ts", import.meta.url).pathname,
    },
  },
});
