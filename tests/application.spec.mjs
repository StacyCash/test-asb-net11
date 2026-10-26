import { test, expect } from '@playwright/test';

test('the standalone Blazor client renders and the counter is interactive', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hello, world!' })).toBeVisible();
  await page.getByRole('link', { name: 'Counter' }).click();
  await expect(page.getByRole('status')).toHaveText('Current count: 0');
  await page.getByRole('button', { name: 'Click me' }).click();
  await expect(page.getByRole('status')).toHaveText('Current count: 1');
  await expect(page.locator('#blazor-error-ui')).toBeHidden();
});

test('the Functions API returns the expected weather data', async ({ request }) => {
  const response = await request.get('http://127.0.0.1:7041/api/Weather');
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual([
    { date: '2022-01-06', temperatureC: 1, summary: 'Freezing' },
    { date: '2022-01-07', temperatureC: 14, summary: 'Bracing' },
    { date: '2022-01-08', temperatureC: -13, summary: 'Freezing' },
    { date: '2022-01-09', temperatureC: -16, summary: 'Balmy' },
    { date: '2022-01-10', temperatureC: -2, summary: 'Chilly' },
  ]);
});

test('Weather fails locally without Static Web Apps API routing', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hello, world!' })).toBeVisible();
  const response = page.waitForResponse((response) =>
    new URL(response.url()).pathname === '/api/Weather');
  await page.getByRole('link', { name: 'Weather' }).click();
  expect((await response).headers()['content-type']).toContain('text/html');
  await expect(page.locator('#blazor-error-ui')).toBeVisible();
});
