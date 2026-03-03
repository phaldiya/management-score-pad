import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/test-results',
  snapshotPathTemplate: '{testDir}/{testFileDir}/{testFileName}-snapshots/{projectName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  reporter: [['html', { outputFolder: './e2e/playwright-report', open: 'never' }]],

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    },
  },

  use: {
    baseURL: `http://localhost:${PORT}/management-score-pad/`,
    trace: 'on-first-retry',
  },

  webServer: {
    command: `bun run dev -- --port ${PORT}`,
    url: `http://localhost:${PORT}/management-score-pad/`,
    reuseExistingServer: !CI,
  },

  projects: [
    {
      name: 'functional',
      testMatch: 'functional/**/*.e2e.ts',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'visual-desktop',
      testMatch: 'visual/**/*.e2e.ts',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'visual-tablet',
      testMatch: 'visual/**/*.e2e.ts',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'visual-mobile',
      testMatch: 'visual/**/*.e2e.ts',
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 }, isMobile: true },
    },
  ],
});
