import { expect, test } from "@playwright/test";

async function empezarLimpio(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise<void>((resolve) => {
      const peticion = indexedDB.deleteDatabase("whereismycar");
      peticion.onsuccess = () => resolve();
      peticion.onerror = () => resolve();
      peticion.onblocked = () => resolve();
    });
  });
  await page.reload();
}

test.describe("aparcamiento en parking", () => {
  test.beforeEach(async ({ page }) => {
    await empezarLimpio(page);
  });

  test("guarda, persiste y desaparece al recoger el coche", async ({ page }) => {
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

  test("muestra el tiempo aparcado y avanza sin recargar", async ({ page }) => {
    await page.getByRole("button", { name: "Parking" }).click();
    await page.getByLabel("Planta").fill("-2");
    await page.getByLabel("Plaza").fill("42");
    await page.getByRole("button", { name: "Guardar aparcamiento" }).click();

    const contador = page.getByRole("timer");
    await expect(contador).toContainText("Lleva aparcado");
    await expect(contador).toHaveText(/Lleva aparcado [1-9]\d* s/);
  });

  test("valida los campos obligatorios", async ({ page }) => {
    await page.getByRole("button", { name: "Parking" }).click();
    await page.getByRole("button", { name: "Guardar aparcamiento" }).click();

    await expect(page.getByRole("alert")).toContainText(
      "Rellena los campos obligatorios.",
    );
  });
});

test.describe("aparcamiento en parking con ubicación opcional", () => {
  test.use({
    geolocation: { latitude: 41.3874, longitude: 2.1686 },
    permissions: ["geolocation"],
  });

  test.beforeEach(async ({ page }) => {
    await empezarLimpio(page);
  });

  test("oculta la ubicación y guarda la dirección si se indica", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Parking" }).click();

    await expect(
      page.getByRole("button", { name: /añadir ubicación/i }),
    ).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Calle" })).toHaveCount(0);

    await page.getByRole("button", { name: /añadir ubicación/i }).click();
    await page
      .getByRole("radio", { name: "Dirección (calle, número y ciudad)" })
      .check();
    await page.getByRole("textbox", { name: "Calle" }).fill("Gran Via");
    await page.getByRole("textbox", { name: "Número" }).fill("10");
    await page.getByRole("textbox", { name: "Ciudad" }).fill("Barcelona");
    await page.getByLabel("Planta").fill("-2");
    await page.getByLabel("Plaza").fill("42");
    await page.getByRole("button", { name: "Guardar aparcamiento" }).click();

    await expect(page.getByText("Aparcamiento guardado")).toBeVisible();
    await expect(page.getByText("Gran Via 10, Barcelona")).toBeVisible();
  });

  test("guarda las coordenadas GPS del parking", async ({ page }) => {
    await page.getByRole("button", { name: "Parking" }).click();
    await page.getByRole("button", { name: /añadir ubicación/i }).click();
    await page.getByRole("radio", { name: "Coordenadas GPS" }).check();
    await page.getByRole("button", { name: "Usar mi ubicación" }).click();

    await expect(page.getByText("Ubicación obtenida")).toBeVisible();

    await page.getByLabel("Planta").fill("-2");
    await page.getByLabel("Plaza").fill("42");
    await page.getByRole("button", { name: "Guardar aparcamiento" }).click();

    await expect(page.getByText("Aparcamiento guardado")).toBeVisible();
    await expect(page.getByText("41.38740, 2.16860")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Abrir en Google Maps" }),
    ).toHaveAttribute(
      "href",
      "https://www.google.com/maps?q=41.3874,2.1686",
    );
  });

  test("exige ubicación si la sección está desplegada", async ({ page }) => {
    await page.getByRole("button", { name: "Parking" }).click();
    await page.getByLabel("Planta").fill("-2");
    await page.getByLabel("Plaza").fill("42");
    await page.getByRole("button", { name: /añadir ubicación/i }).click();
    await page.getByRole("button", { name: "Guardar aparcamiento" }).click();

    await expect(
      page.getByText("Rellena los campos obligatorios."),
    ).toBeVisible();
    await expect(page.getByText("Aparcamiento guardado")).toHaveCount(0);
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
    await page
      .getByRole("radio", { name: "Ubicación GPS y dirección" })
      .check();
    await page.getByRole("textbox", { name: "Calle" }).fill("Gran Via");
    await page.getByRole("textbox", { name: "Número" }).fill("10");
    await page.getByRole("textbox", { name: "Ciudad" }).fill("Barcelona");
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

  test("guarda solo con GPS", async ({ page }) => {
    await page.getByRole("button", { name: "En la calle" }).click();
    await page.getByRole("radio", { name: "Solo ubicación GPS" }).check();
    await page.getByRole("button", { name: "Usar mi ubicación" }).click();

    await expect(page.getByText("Ubicación obtenida")).toBeVisible();
    await page.getByRole("button", { name: "Guardar aparcamiento" }).click();

    await expect(page.getByText("Aparcamiento guardado")).toBeVisible();
    await expect(page.getByText("41.38740, 2.16860")).toBeVisible();
    await expect(page.getByText("Dirección")).toHaveCount(0);
  });

  test("guarda solo con calle y número, sin GPS", async ({ page }) => {
    await page.getByRole("button", { name: "En la calle" }).click();
    await page.getByRole("radio", { name: "Solo calle y número" }).check();
    await page.getByRole("textbox", { name: "Calle" }).fill("Gran Via");
    await page.getByRole("textbox", { name: "Número" }).fill("10");
    await page.getByRole("button", { name: "Guardar aparcamiento" }).click();

    await expect(page.getByText("Aparcamiento guardado")).toBeVisible();
    await expect(page.getByText("Gran Via 10", { exact: true })).toBeVisible();
    await expect(page.getByText("Coordenadas")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Abrir en Google Maps" }),
    ).toHaveCount(0);
  });

  test("guarda sin ciudad porque es opcional", async ({ page }) => {
    await page.getByRole("button", { name: "En la calle" }).click();
    await page
      .getByRole("radio", { name: "Ubicación GPS y dirección" })
      .check();
    await page.getByRole("textbox", { name: "Calle" }).fill("Gran Via");
    await page.getByRole("textbox", { name: "Número" }).fill("10");
    await page.getByRole("button", { name: "Usar mi ubicación" }).click();

    await expect(page.getByText("Ubicación obtenida")).toBeVisible();
    await page.getByRole("button", { name: "Guardar aparcamiento" }).click();

    await expect(page.getByText("Aparcamiento guardado")).toBeVisible();
    await expect(page.getByText("Gran Via 10", { exact: true })).toBeVisible();
  });

  test("no permite guardar en modo completo sin ubicación GPS", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "En la calle" }).click();
    await page
      .getByRole("radio", { name: "Ubicación GPS y dirección" })
      .check();
    await page.getByRole("textbox", { name: "Calle" }).fill("Gran Via");
    await page.getByRole("textbox", { name: "Número" }).fill("10");
    await page.getByRole("textbox", { name: "Ciudad" }).fill("Barcelona");
    await page.getByRole("button", { name: "Guardar aparcamiento" }).click();

    await expect(
      page.getByText("Obtén tu ubicación GPS antes de guardar."),
    ).toBeVisible();
    await expect(page.getByText("Aparcamiento guardado")).toHaveCount(0);
  });

  test("el registro se conserva tras recoger el coche", async ({ page }) => {
    await page.getByRole("button", { name: "En la calle" }).click();
    await page.getByRole("radio", { name: "Solo calle y número" }).check();
    await page.getByRole("textbox", { name: "Calle" }).fill("Gran Via");
    await page.getByRole("textbox", { name: "Número" }).fill("10");
    await page.getByRole("button", { name: "Guardar aparcamiento" }).click();

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

    const registros = await page.evaluate(
      () =>
        new Promise<number>((resolve, reject) => {
          const peticion = indexedDB.open("whereismycar");
          peticion.onerror = () => reject(peticion.error);
          peticion.onsuccess = () => {
            const db = peticion.result;
            const tx = db.transaction("aparcamientos", "readonly");
            const contar = tx.objectStore("aparcamientos").count();
            contar.onsuccess = () => {
              db.close();
              resolve(contar.result);
            };
          };
        }),
    );

    expect(registros).toBe(1);
  });
});
