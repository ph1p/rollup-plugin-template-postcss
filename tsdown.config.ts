import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  deps: {
    onlyBundle: false,
  },
  dts: true,
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  outDir: "dist",
});
