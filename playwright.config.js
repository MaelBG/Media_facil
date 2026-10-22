import { defineConfig, devices } from "@playwright/test";
import { requireSafeE2EConfig } from "./tests/e2e/safety.js";

const e2eConfig = requireSafeE2EConfig({
  target: process.env.E2E_TARGET,
  env: process.env,
});

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.js",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: e2eConfig.baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "node ./node_modules/vite/bin/vite.js --config vite.e2e.config.js --host 127.0.0.1 --port 4178 --strictPort",
    url: e2eConfig.baseURL,
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: {
      E2E_TARGET: "demo",
      E2E_BASE_URL: e2eConfig.baseURL,
      VITE_APP_DATA_MODE: "demo",
      VITE_APP_ENV: "local",
      VITE_SUPABASE_URL: "",
      VITE_SUPABASE_ANON_KEY: "",
    },
  },
});
