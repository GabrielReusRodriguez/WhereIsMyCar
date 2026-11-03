import { expect, test } from "@playwright/test";

test("sigue funcionando sin conexión una vez cargada", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);

  // Segunda carga para que el service worker controle la página.
  await page.reload();
  await page.waitForFunction(
    () => navigator.serviceWorker.controller !== null,
  );

  await context.setOffline(true);
  await page.reload();

  await expect(
    page.getByRole("heading", { name: "¿Dónde has aparcado?" }),
  ).toBeVisible();

  await context.setOffline(false);
});
