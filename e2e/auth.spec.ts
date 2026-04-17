import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");

    // Check page title/heading
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();

    // Check form elements exist
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

    // Check signup link
    await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();
  });

  test("signup page renders correctly", async ({ page }) => {
    await page.goto("/signup");

    // Check page title/heading
    await expect(
      page.getByRole("heading", { name: /create.*(account|sign up)/i })
    ).toBeVisible();

    // Check form elements exist
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /sign up|create/i })).toBeVisible();

    // Check login link
    await expect(page.getByRole("link", { name: /sign in|log in/i })).toBeVisible();
  });

  test("shows validation errors for empty login form", async ({ page }) => {
    await page.goto("/login");

    // Try to submit empty form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should show validation errors
    await expect(page.getByText(/email.*required|please.*email/i)).toBeVisible();
  });

  test("forgot password page is accessible", async ({ page }) => {
    await page.goto("/login");

    // Click forgot password link
    await page.getByRole("link", { name: /forgot.*password/i }).click();

    // Should navigate to forgot password page
    await expect(page).toHaveURL(/forgot-password/);
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("redirects unauthenticated users from protected routes", async ({
    page,
  }) => {
    // Try to access dashboard without authentication
    await page.goto("/");

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test("redirects unauthenticated users from quality-gate", async ({ page }) => {
    await page.goto("/quality-gate");
    await expect(page).toHaveURL(/login/);
  });

  test("redirects unauthenticated users from signal", async ({ page }) => {
    await page.goto("/signal");
    await expect(page).toHaveURL(/login/);
  });

  test("redirects unauthenticated users from horizon", async ({ page }) => {
    await page.goto("/horizon");
    await expect(page).toHaveURL(/login/);
  });

  test("redirects unauthenticated users from settings", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/login/);
  });
});
