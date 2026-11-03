import { expect, test } from "@playwright/test";

test("cambia a catalán y persiste tras recargar", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: "Català" }).click();

  await expect(
    page.getByRole("heading", { name: "On has aparcat?" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ca");

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "On has aparcat?" }),
  ).toBeVisible();
});

test("vuelve al castellano", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: "Català" }).click();
  await page.getByRole("button", { name: "Castellano" }).click();

  await expect(
    page.getByRole("heading", { name: "¿Dónde has aparcado?" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
});
