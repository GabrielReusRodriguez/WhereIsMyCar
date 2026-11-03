import { expect, test } from "@playwright/test";

async function empezarLimpio(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

test.describe("aparcamiento en parking", () => {
  test.beforeEach(async ({ page }) => {
    await empezarLimpio(page);
  });

  test("guarda, persiste y se elimina al recoger el coche", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "¿Dónde has aparcado?" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Parking" }).click();
    await page.getByLabel("Planta").fill("-2");
    await page.getByLabel(/Zona/).fill("A");
    await page.getByLabel("Plaza").fill("42");
    await page.getByRole("button", { name: "Guardar aparcamiento" }).click();

    await expect(page.getByText("Aparcamiento guardado")).toBeVisible();
    await expect(page.getByText("-2")).toBeVisible();
    await expect(page.getByText("A", { exact: true })).toBeVisible();
    await expect(page.getByText("42")).toBeVisible();

    await page.reload();
    await expect(page.getByText("Aparcamiento guardado")).toBeVisible();

    await page
      .getByRole("button", { name: "He recogido el coche", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Sí, he recogido el coche" })
      .click();

    await expect(
      page.getByRole("heading", { name: "¿Dónde has aparcado?" }),
    ).toBeVisible();
    await expect(page.getByText("Aparcamiento guardado")).toHaveCount(0);
  });

  test("valida los campos obligatorios", async ({ page }) => {
    await page.getByRole("button", { name: "Parking" }).click();
    await page.getByRole("button", { name: "Guardar aparcamiento" }).click();

    await expect(page.getByRole("alert")).toContainText(
      "Rellena los campos obligatorios.",
    );
  });
});

test.describe("aparcamiento en la calle", () => {
  test.use({
    geolocation: { latitude: 41.3874, longitude: 2.1686 },
    permissions: ["geolocation"],
  });

  test.beforeEach(async ({ page }) => {
    await empezarLimpio(page);
  });

  test("guarda dirección, GPS, pago y enlace a Google Maps", async ({ page }) => {
    await page.getByRole("button", { name: "En la calle" }).click();
    await page.getByLabel("Calle").fill("Gran Via");
    await page.getByLabel("Número").fill("10");
    await page.getByLabel("Ciudad").fill("Barcelona");
    await page.getByRole("button", { name: "Usar mi ubicación" }).click();

    await expect(page.getByText("Ubicación obtenida")).toBeVisible();
    await page.getByRole("radio", { name: "Sí" }).check();
    await page.getByRole("button", { name: "Guardar aparcamiento" }).click();

    await expect(page.getByText("Gran Via 10, Barcelona")).toBeVisible();
    await expect(page.getByText("41.38740, 2.16860")).toBeVisible();

    const enlace = page.getByRole("link", { name: "Abrir en Google Maps" });
    await expect(enlace).toHaveAttribute(
      "href",
      "https://www.google.com/maps?q=41.3874,2.1686",
    );
  });

  test("no permite guardar sin ubicación GPS", async ({ page }) => {
    await page.getByRole("button", { name: "En la calle" }).click();
    await page.getByLabel("Calle").fill("Gran Via");
    await page.getByLabel("Número").fill("10");
    await page.getByLabel("Ciudad").fill("Barcelona");
    await page.getByRole("button", { name: "Guardar aparcamiento" }).click();

    await expect(
      page.getByText("Obtén tu ubicación GPS antes de guardar."),
    ).toBeVisible();
    await expect(page.getByText("Aparcamiento guardado")).toHaveCount(0);
  });
});
