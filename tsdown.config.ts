import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  platform: "node",
  clean: true,
  minify: true,
  treeshake: true,
  publint: "ci-only",
  attw: "ci-only",
  failOnWarn: "ci-only",
  unused: {
    ignore: ["tailwindcss"],
  },
  exports: true,
});
