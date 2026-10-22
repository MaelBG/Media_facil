/* global process */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { resolveSafeE2EConfig } from "../tests/e2e/safety.js";

const args = process.argv.slice(2);
let target;
const playwrightArgs = [];

for (let index = 0; index < args.length; index += 1) {
  if (args[index] === "--target") {
    target = args[index + 1];
    index += 1;
  } else {
    playwrightArgs.push(args[index]);
  }
}

let config;
try {
  config = resolveSafeE2EConfig({ target, env: process.env });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const childEnv = { ...process.env };
for (const key of Object.keys(childEnv)) {
  if (key.startsWith("VITE_SUPABASE_") || key.startsWith("SUPABASE_")) delete childEnv[key];
}
childEnv.E2E_TARGET = config.target;
childEnv.E2E_BASE_URL = config.baseURL;
childEnv.VITE_APP_DATA_MODE = config.appMode;
childEnv.VITE_APP_ENV = config.appEnvironment;
childEnv.VITE_SUPABASE_URL = "";
childEnv.VITE_SUPABASE_ANON_KEY = "";

const require = createRequire(import.meta.url);
const playwrightCli = require.resolve("@playwright/test/cli");
const result = spawnSync(process.execPath, [playwrightCli, "test", ...playwrightArgs], {
  env: childEnv,
  stdio: "inherit",
});

if (result.error) {
  console.error(`Não foi possível iniciar Playwright: ${result.error.message}`);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
