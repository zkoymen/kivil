import { expect, test } from '@playwright/test'

test('runs the core Kıvıl session flow', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await expect(page.getByText('EMPTY')).toHaveCount(0)
  await page.getByLabel('Session name').fill('Smoke session')
  await page.getByLabel('Start session').getByRole('button', { name: 'Start Session' }).click()

  await expect(page.getByText('Elapsed')).toBeVisible()
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByLabel('Kıvıl duration').fill('1')
  await page.getByRole('button', { name: 'Close panel' }).click()
  await page.getByRole('button', { name: 'Start Kıvıl' }).click()

  await expect(page.getByRole('textbox', { name: 'Kıvıl note' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Kıvıl note' }).fill('Review current direction.')
  await page.getByRole('button', { name: 'Save Note' }).click()
  await page.getByRole('button', { name: 'Complete' }).click()
  await page.getByRole('button', { name: 'End Session' }).click()

  await expect(page.getByRole('heading', { name: 'Session complete.' })).toBeVisible()
  await page.getByRole('button', { name: 'History' }).click()
  await expect(page.getByText('Saved Sessions')).toBeVisible()
  await expect(page.getByLabel('Saved session name')).toHaveValue('Smoke session')

  await page.getByLabel('Saved session name').fill('Renamed smoke session')
  await expect(page.getByRole('heading', { name: 'Renamed smoke session' })).toBeVisible()

  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('heading', { name: 'Your craft deserves undivided attention.' })).toBeVisible()
})
