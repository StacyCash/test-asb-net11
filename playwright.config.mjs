import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.mjs',
  use: { baseURL: 'http://127.0.0.1:5009' },
  webServer: [
    {
      command: 'dotnet run --project Client --no-launch-profile --urls http://127.0.0.1:5009',
      url: 'http://127.0.0.1:5009',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'dotnet run --project Api --no-launch-profile --urls http://127.0.0.1:7041',
      url: 'http://127.0.0.1:7041/api/health',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
