import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('agent can search, open, reply to, reprioritize, and resolve a conversation', async ({ page }) => {
  await page.getByRole('button', { name: 'Demo as support agent' }).click()
  await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Maya Thompson/ }).locator('.unread')).toHaveCount(0)

  await page.getByLabel('Search conversations').fill('loan')
  await expect(page.getByText('Daniel Brooks')).toBeVisible()
  await page.getByText('Daniel Brooks').click()

  const priorityControl = page.getByLabel('Conversation priority')
  if (await priorityControl.isVisible()) {
    await priorityControl.selectOption('normal')
    await expect(priorityControl).toHaveValue('normal')
  }

  await page.getByLabel('Reply message').fill('Your verification is complete. I can move this forward now.')
  await page.getByRole('button', { name: /Send reply/ }).click()
  await expect(page.getByText('Your verification is complete. I can move this forward now.')).toBeVisible()

  await page.getByLabel('Conversation status').selectOption('resolved')
  await expect(page.getByLabel('Conversation status')).toHaveValue('resolved')
})

test('agent navigation exposes working customers and reports views', async ({ page }) => {
  await page.getByRole('button', { name: 'Demo as support agent' }).click()

  await page.getByRole('button', { name: 'Customers' }).click()
  await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible()
  await expect(page.getByText('Aisha Reed')).toBeVisible()

  await page.getByRole('button', { name: 'Reports' }).click()
  await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible()
  await expect(page.getByText('Unread messages')).toBeVisible()

  await page.getByRole('button', { name: 'Inbox' }).click()
  await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible()
})

test('customer can choose an identity, navigate back to the picker, and send a support message', async ({ page }) => {
  await page.getByRole('button', { name: 'Demo as customer' }).click()
  await expect(page.getByRole('heading', { name: 'Which customer would you like to be?' })).toBeVisible()

  await page.getByRole('button', { name: /Daniel Brooks/ }).click()
  await expect(page.getByRole('heading', { name: 'Loan application status' })).toBeVisible()

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('heading', { name: 'Which customer would you like to be?' })).toBeVisible()

  await page.getByRole('button', { name: /Daniel Brooks/ }).click()
  await page.getByLabel('Customer message').fill('Can you confirm whether you need anything else from me?')
  await page.getByRole('button', { name: /Send message/ }).click()
  await expect(page.getByText('Can you confirm whether you need anything else from me?')).toBeVisible()

  await page.getByRole('button', { name: 'Switch customer' }).click()
  await expect(page.getByText('Maya Thompson')).toBeVisible()

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('heading', { name: 'SupportDesk' })).toBeVisible()
})
