const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/ui",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:5500",
    headless: true,
    viewport: { width: 1600, height: 900 }
  },
  webServer: {
    command: "npm run start:web",
    url: "http://127.0.0.1:5500",
    reuseExistingServer: true,
    timeout: 120000
  }
});
