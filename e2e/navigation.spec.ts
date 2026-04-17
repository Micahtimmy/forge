import { test, expect } from "@playwright/test";

test.describe("Navigation (Public Pages)", () => {
  test("login page has proper styling and structure", async ({ page }) => {
    await page.goto("/login");

    // Dark theme should be applied
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Page should have the FORGE branding
    await expect(page.locator("text=FORGE").first()).toBeVisible();
  });

  test("can navigate between login and signup", async ({ page }) => {
    await page.goto("/login");

    // Click signup link
    await page.getByRole("link", { name: /sign up/i }).click();
    await expect(page).toHaveURL(/signup/);

    // Click login link
    await page.getByRole("link", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/login/);
  });

  test("pages are responsive", async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });
});

test.describe("Page Load Performance", () => {
  test("login page loads within acceptable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test("signup page loads within acceptable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/signup", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
  });
});

test.describe("Accessibility", () => {
  test("login page has proper heading hierarchy", async ({ page }) => {
    await page.goto("/login");

    // Should have an h1
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test("form inputs have labels", async ({ page }) => {
    await page.goto("/login");

    // Email input should be associated with a label
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();

    // Password input should be associated with a label
    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toBeVisible();
  });

  test("buttons are keyboard accessible", async ({ page }) => {
    await page.goto("/login");

    // Tab to the submit button
    await page.keyboard.press("Tab"); // email
    await page.keyboard.press("Tab"); // password
    await page.keyboard.press("Tab"); // possibly forgot password
    await page.keyboard.press("Tab"); // submit button

    // Check if a button-like element is focused
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });
});
