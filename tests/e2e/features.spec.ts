import { test, expect } from '@playwright/test';

test.describe('Numbers Page', () => {
    test.use({
        storageState: './tests/e2e/fixtures/auth.json'
    });

    test.beforeEach(async ({ page }) => {
        await page.goto('/numbers');
    });

    test('should display search form', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /search available numbers/i })).toBeVisible();
        await expect(page.getByText(/country/i)).toBeVisible();
        await expect(page.getByPlaceholder(/area code/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /search/i })).toBeVisible();
    });

    test('should have country selector with options', async ({ page }) => {
        const countrySelect = page.locator('.search-select');
        await expect(countrySelect).toBeVisible();

        await countrySelect.selectOption('United Kingdom');
        await expect(countrySelect).toHaveValue('GB');
    });

    test('should toggle number type', async ({ page }) => {
        const localBtn = page.getByRole('button', { name: 'Local' });
        const tollFreeBtn = page.getByRole('button', { name: 'Toll-Free' });

        await expect(localBtn).toHaveClass(/active/);

        await tollFreeBtn.click();
        await expect(tollFreeBtn).toHaveClass(/active/);
        await expect(localBtn).not.toHaveClass(/active/);
    });

    test('should display your numbers section', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /your numbers/i })).toBeVisible();
    });

    test('should show empty state when no numbers', async ({ page }) => {
        await expect(page.getByText(/no numbers yet/i)).toBeVisible();
    });
});

test.describe('Wallet Page', () => {
    test.use({
        storageState: './tests/e2e/fixtures/auth.json'
    });

    test.beforeEach(async ({ page }) => {
        await page.goto('/wallet');
    });

    test('should display balance card', async ({ page }) => {
        await expect(page.getByText(/available balance/i)).toBeVisible();
        await expect(page.getByText(/\$\d+\.\d{2}/)).toBeVisible();
    });

    test('should have add funds button', async ({ page }) => {
        await expect(page.getByRole('button', { name: /add funds/i })).toBeVisible();
    });

    test('should open top-up modal', async ({ page }) => {
        await page.getByRole('button', { name: /add funds/i }).first().click();

        await expect(page.getByRole('heading', { name: /add funds/i })).toBeVisible();
        await expect(page.getByText(/\$10/)).toBeVisible();
        await expect(page.getByText(/\$25/)).toBeVisible();
        await expect(page.getByText(/\$50/)).toBeVisible();
        await expect(page.getByText(/\$100/)).toBeVisible();
    });

    test('should select preset amount', async ({ page }) => {
        await page.getByRole('button', { name: /add funds/i }).first().click();

        const preset50 = page.getByRole('button', { name: '$50' });
        await preset50.click();

        await expect(preset50).toHaveClass(/active/);
        await expect(page.getByText(/\$50\.00/)).toBeVisible();
    });

    test('should allow custom amount input', async ({ page }) => {
        await page.getByRole('button', { name: /add funds/i }).first().click();

        await page.getByPlaceholder(/enter amount/i).fill('75');
        await expect(page.getByText(/\$75\.00/)).toBeVisible();
    });

    test('should display transaction history section', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /transaction history/i })).toBeVisible();
    });
});
