import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "lucide-react",
    "@yyc3/i18n-core",
    "@radix-ui/react-slider",
    "@radix-ui/react-tabs",
    "clsx",
    "tailwind-merge"
  ]
});
