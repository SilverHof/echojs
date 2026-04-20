import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const echojsRoot = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../packages/echojs-jsx",
);

/** Дев-сборка идёт с исходников пакета, без предварительного `tsc` в echojs-jsx. */
export default defineConfig({
  resolve: {
    alias: {
      "echojs-jsx": path.join(echojsRoot, "src/index.ts"),
      "echojs-jsx/jsx-runtime": path.join(echojsRoot, "src/jsx-runtime.ts"),
      "echojs-jsx/jsx-dev-runtime": path.join(echojsRoot, "src/jsx-dev-runtime.ts"),
    },
  },
  server: {
    port: 5174,
    open: true,
  },
});
