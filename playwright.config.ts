import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  retries: isCI ? 2 : 0,
  /* テスト並列実行の制限（ゲーム状態の干渉を防ぐ） */
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 1080 },
        launchOptions: {
          args: [
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
          ],
        },
      },
    },
  ],
  webServer: {
    /* CI ではビルド済みの dist を配信、ローカルでは webpack dev server */
    command: isCI ? 'npx serve dist -s -l 3000' : 'npm start',
    port: 3000,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
  /* テスト結果レポート */
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
});
