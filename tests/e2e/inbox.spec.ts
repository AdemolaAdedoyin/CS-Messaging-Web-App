import { expect, test } from '@playwright/test'

test('agent can search, open, reply to, and resolve a conversation', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible()

  await page.getByLabel('Search conversations').fill('loan')
  await expect(page.getByText('Daniel Brooks')).toBeVisible()
  await page.getByText('Daniel Brooks').click()

  await page.getByLabel('Reply message').fill('Your verification is complete. I can move this forward now.')
  await page.getByRole('button', { name: /Send reply/ }).click()
  await expect(page.getByText('Your verification is complete. I can move this forward now.')).toBeVisible()

  await page.getByLabel('Conversation status').selectOption('resolved')
  await expect(page.getByLabel('Conversation status')).toHaveValue('resolved')
})
