/**
 * Точка входа демо: монтирует тот же сценарий, что и examples/usage-example.ts
 */
import { runExample } from "../../../packages/echojs-jsx/examples/usage-example.js";

const root = document.getElementById("app");
if (!root) {
  throw new Error("#app not found");
}

runExample(root);
