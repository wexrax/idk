import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const userArgs = process.argv.slice(2);
const argsAfterSeparator =
  userArgs[0] === "--" ? userArgs.slice(1) : userArgs;
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const vitestConfigPath = join(projectRoot, "vitest.config.ts");

const vitestArgs =
  argsAfterSeparator.length === 0
    ? ["run", "--config", vitestConfigPath, "--root", projectRoot, "--passWithNoTests"]
    : ["run", "--config", vitestConfigPath, "--root", projectRoot, ...argsAfterSeparator];

const require = createRequire(import.meta.url);
const vitestPackagePath = require.resolve("vitest/package.json");
const vitestBinPath = join(dirname(vitestPackagePath), "vitest.mjs");
const child = spawn(process.execPath, [vitestBinPath, ...vitestArgs], {
  cwd: projectRoot,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
