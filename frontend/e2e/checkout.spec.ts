import { expect, test } from "@playwright/test";

// Uses the seeded demo accounts/catalog from backend/prisma/seed.ts — no real payment
// credentials are involved; PAYMENT_PROVIDER=mock settles the order instantly.
const CUSTOMER_EMAIL = "customer@example.com";
const CUSTOMER_PASSWORD = "Customer@12345";
const PRODUCT_SLUG = "blank-canvas-oversized-tee";

test("add product to cart, complete checkout, and reach order confirmation", async ({ page }) => {
  await page.goto("/login");
  await page.locator("#email").fill(CUSTOMER_EMAIL);
  await page.locator("#password").fill(CUSTOMER_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/account");

  await page.goto(`/products/${PRODUCT_SLUG}`);
  // Exact match: the seeded stock for this product's "S" size is well above the low-stock
  // threshold, so it's never disabled. A loose `/^Size /` pattern would also match the
  // unrelated "Size Guide" button and click that instead.
  await page.getByRole("button", { name: "Size S", exact: true }).click();
  await page.getByRole("button", { name: "Add to Bag" }).click();

  await page.goto("/checkout");
  await page.getByRole("button", { name: "Continue to Payment" }).click();
  await page.getByRole("button", { name: "Review Order" }).click();
  await page.getByRole("button", { name: /^Place Order/ }).click();

  await page.waitForURL(/\/checkout\/confirmation\//, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Order Confirmed" })).toBeVisible();
  await expect(page.getByText(/Order number/)).toBeVisible();
});
