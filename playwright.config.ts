import { defineConfig, devices } from "@playwright/test";

const larguras = [320, 768, 1024, 1440, 1920];

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "npm run build && npm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  use: { baseURL: "http://localhost:3000" },
  projects: larguras.map((w) => ({
    name: `w${w}`,
    use: { ...devices["Desktop Chrome"], viewport: { width: w, height: 900 } },
  })),
});
