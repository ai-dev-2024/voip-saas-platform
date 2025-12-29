import { test, expect, Page } from '@playwright/test';

// Helper to login
async function login(page: Page, email = 'test@example.com', password = 'password123') {
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByPlaceholder(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
}

test.describe('Dashboard', () => {
    test.use({
        storageState: './tests/e2e/fixtures/auth.json'
    });

    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard');
    });

    test('should display welcome message', async ({ page }) => {
        await expect(page.getByRole('heading', { level: 1 })).toContainText(/welcome back/i);
    });

    test('should display stats cards', async ({ page }) => {
        await expect(page.getByText(/active numbers/i)).toBeVisible();
        await expect(page.getByText(/countries/i)).toBeVisible();
        await expect(page.getByText(/minutes used/i)).toBeVisible();
        await expect(page.getByText(/balance/i)).toBeVisible();
    });

    test('should display quick actions', async ({ page }) => {
        await expect(page.getByText(/get a phone number/i)).toBeVisible();
        await expect(page.getByText(/add funds/i)).toBeVisible();
    });

    test('should navigate to numbers page from quick action', async ({ page }) => {
        await page.getByText(/get a phone number/i).click();
        await expect(page).toHaveURL(/\/numbers/);
    });

    test('should navigate to wallet page from quick action', async ({ page }) => {
        await page.getByText(/add funds/i).click();
        await expect(page).toHaveURL(/\/wallet/);
    });
});

test.describe('Navigation', () => {
    test.use({
        storageState: './tests/e2e/fixtures/auth.json'
    });

    test('should have working sidebar navigation', async ({ page }) => {
        await page.goto('/dashboard');

        // Navigate to Numbers
        await page.getByRole('link', { name: /numbers/i }).click();
        await expect(page).toHaveURL(/\/numbers/);
        await expect(page.getByRole('heading', { name: /phone numbers/i })).toBeVisible();

        // Navigate to Wallet
        await page.getByRole('link', { name: /wallet/i }).click();
        await expect(page).toHaveURL(/\/wallet/);
        await expect(page.getByRole('heading', { name: /wallet/i })).toBeVisible();

        // Navigate to Calls
        await page.getByRole('link', { name: /calls/i }).click();
        await expect(page).toHaveURL(/\/calls/);
        await expect(page.getByRole('heading', { name: /calls/i })).toBeVisible();

        // Navigate to Settings
        await page.getByRole('link', { name: /settings/i }).click();
        await expect(page).toHaveURL(/\/settings/);
        await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
    });

    test('should show active state for current page', async ({ page }) => {
        await page.goto('/numbers');

        const numbersLink = page.getByRole('link', { name: /numbers/i });
        await expect(numbersLink).toHaveClass(/active/);
    });
});
