import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;

/**
 * Runs against the production build with a throwaway embedded database.
 * Run `npm run build` first.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  fullyParallel: false,
  timeout: 45_000,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, ...devices["Desktop Chrome"], locale: "en-GB", timezoneId: "Europe/Oslo" },
  webServer: {
    command: `rm -rf .data/e2e && npm run -s db:setup && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      PGLITE_DIR: ".data/e2e",
      ALLOW_EMBEDDED_DB: "1",
      APP_SECRET: "e2e-secret",
      ADMIN_EMAIL: "admin@example.com",
      ADMIN_PASSWORD: "e2e-admin-password",
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
    },
  },
});
