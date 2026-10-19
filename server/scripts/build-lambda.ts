// Bundles the server into one ES module for AWS Lambda, with the cast data
// next to it: dist/lambda/index.mjs + dist/lambda/data/.
import { build } from "esbuild";
import { cp, rm } from "node:fs/promises";

const root = new URL("..", import.meta.url);
const out = new URL("dist/lambda/", root);

await rm(out, { recursive: true, force: true });
await build({
  entryPoints: [new URL("src/lambda.ts", root).pathname],
  outfile: new URL("index.mjs", out).pathname,
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  conditions: ["source"],
  minify: true,
  sourcemap: true,
  // Some AWS SDK dependencies still call require() inside an ES module bundle.
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  logLevel: "info",
});
await cp(new URL("data/", root), new URL("data/", out), { recursive: true }).catch((error: NodeJS.ErrnoException) => {
  if (error.code !== "ENOENT") throw error;
});
