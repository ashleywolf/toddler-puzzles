const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4178/toddler-puzzles/', trace: 'retain-on-failure' },
  webServer: {
    command: 'python3 -m http.server 4178 --bind 127.0.0.1 --directory ..',
    url: 'http://127.0.0.1:4178/toddler-puzzles/',
    reuseExistingServer: false
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit-tablet', use: { ...devices['iPad (gen 7)'] } }
  ]
});
