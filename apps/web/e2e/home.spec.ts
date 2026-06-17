import { expect, test } from "@playwright/test";

test("renders the audit events workspace", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Event stream" })).toBeVisible();
});
