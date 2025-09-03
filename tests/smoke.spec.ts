import { test, expect } from '@playwright/test'

test('admin login page shows', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Дашборд')).toBeVisible()
})

