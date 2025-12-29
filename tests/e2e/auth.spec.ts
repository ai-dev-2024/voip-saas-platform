import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should redirect to login when not authenticated', async ({ page }) => {
        await expect(page).toHaveURL(/\/login/);
    });

    test('should display login form', async ({ page }) => {
        await page.goto('/login');

        await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
        await expect(page.getByPlaceholder(/email/i)).toBeVisible();
        await expect(page.getByPlaceholder(/password/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should show validation errors on empty submit', async ({ page }) => {
        await page.goto('/login');

        await page.getByRole('button', { name: /sign in/i }).click();

        await expect(page.getByText(/email is required/i)).toBeVisible();
        await expect(page.getByText(/password is required/i)).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
        await page.goto('/login');

        await page.getByPlaceholder(/email/i).fill('invalid-email');
        await page.getByPlaceholder(/password/i).fill('password123');
        await page.getByRole('button', { name: /sign in/i }).click();

        await expect(page.getByText(/valid email/i)).toBeVisible();
    });

    test('should navigate to register page', async ({ page }) => {
        await page.goto('/login');

        await page.getByRole('link', { name: /create account/i }).click();

        await expect(page).toHaveURL(/\/register/);
        await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    });

    test('should display register form with all fields', async ({ page }) => {
        await page.goto('/register');

        await expect(page.getByPlaceholder(/first name/i)).toBeVisible();
        await expect(page.getByPlaceholder(/last name/i)).toBeVisible();
        await expect(page.getByPlaceholder(/email/i)).toBeVisible();
        await expect(page.getByPlaceholder('••••••••')).toHaveCount(2); // Password + Confirm
        await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    });

    test('should show password strength indicator', async ({ page }) => {
        await page.goto('/register');

        // Weak password
        await page.locator('input[name="password"]').fill('weak');
        await expect(page.getByText(/too short/i)).toBeVisible();

        // Strong password
        await page.locator('input[name="password"]').fill('StrongPass123!');
        await expect(page.getByText(/strong/i)).toBeVisible();
    });

    test('should validate password match', async ({ page }) => {
        await page.goto('/register');

        await page.getByPlaceholder(/first name/i).fill('John');
        await page.getByPlaceholder(/last name/i).fill('Doe');
        await page.getByPlaceholder(/email/i).fill('john@example.com');
        await page.locator('input[name="password"]').fill('Password123!');
        await page.locator('input[name="confirmPassword"]').fill('DifferentPass');
        await page.getByRole('button', { name: /create account/i }).click();

        await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    });
});
