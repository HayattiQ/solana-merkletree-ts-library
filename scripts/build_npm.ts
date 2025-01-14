// ex. scripts/build_npm.ts
import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

await build({
  entryPoints: ["./index.ts"],
  outDir: "./npm",
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    // package.json properties
    name: "merkletree-ts-library",
    version: Deno.args[0],
    description: "Merkle Tree Library",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/HayattiQ/solana-merkletree-ts-library.git",
    },
    bugs: {
      url: "https://github.com/HayattiQ/solana-merkletree-ts-library/issues",
    },
  },
  postBuild() {
  },
});