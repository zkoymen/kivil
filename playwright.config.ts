import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    viewport: {
      width: 1280,
      height: 720,
    },
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    reuseExistingServer: true,
    timeout: 120_000,
    url: 'http://127.0.0.1:5173',
  },
})
