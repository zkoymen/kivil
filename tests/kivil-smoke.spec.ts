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
  await expect(page.getByRole('heading', { name: 'Stay with the work.' })).toBeVisible()
})

test('restores an unfinished session after reload', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.getByLabel('Session name').fill('Persistent session')
  await page.getByLabel('Start session').getByRole('button', { name: 'Start Session' }).click()
  await expect(page.getByRole('button', { name: 'End Session' })).toBeVisible()

  await page.reload()

  await expect(page.getByRole('heading', { name: 'Session is paused.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Resume Focus' })).toBeVisible()
  await expect(page.getByText('Current segment: Persistent session')).toBeVisible()
})

test('switches between normal and compact mode', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.getByLabel('Session name').fill('Compact session')
  await page.getByLabel('Start session').getByRole('button', { name: 'Start Session' }).click()
  await page.getByRole('button', { name: 'Compact' }).click()

  await expect(page.getByLabel('Compact session')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Return to normal mode' })).toBeVisible()

  await page.getByRole('button', { name: 'Return to normal mode' }).click()
  await expect(page.getByRole('button', { name: 'Compact' })).toBeVisible()
  await expect(page.getByText('Current segment: Compact session')).toBeVisible()
})
