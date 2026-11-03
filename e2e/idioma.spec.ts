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

test("lang=ca abre la app en catalán e ignora el idioma guardado", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.goto("/?lang=ca");

  await expect(
    page.getByRole("heading", { name: "On has aparcat?" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ca");

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "On has aparcat?" }),
  ).toBeVisible();
});

test("lang=es abre la app en castellano aunque esté guardado catalán", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: "Català" }).click();
  await page.goto("/?lang=es");

  await expect(
    page.getByRole("heading", { name: "¿Dónde has aparcado?" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
});

test("cambiar de idioma actualiza el parámetro lang de la URL", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: "Català" }).click();

  await expect(page).toHaveURL(/[?&]lang=ca\b/);
});
