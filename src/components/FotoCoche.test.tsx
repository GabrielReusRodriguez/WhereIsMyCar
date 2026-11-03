import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "../i18n";
import { FotoCoche, type FotoSeleccionada } from "./FotoCoche";

describe("FotoCoche", () => {
  it("avisa cuando se selecciona una imagen", async () => {
    const onCambio = vi.fn();
    const usuario = userEvent.setup();

    const { container } = render(
      <FotoCoche foto={null} onCambio={onCambio} />,
    );

    const input = container.querySelector<HTMLInputElement>(
      'input[type="file"]',
    );
    expect(input).not.toBeNull();

    const archivo = new File(["foto"], "coche.jpg", { type: "image/jpeg" });
    await usuario.upload(input as HTMLInputElement, archivo);

    expect(onCambio).toHaveBeenCalledWith({
      blob: archivo,
      url: expect.stringMatching(/^blob:/),
    });
  });

  it("permite quitar la foto existente", async () => {
    const onCambio = vi.fn();
    const usuario = userEvent.setup();
    const foto: FotoSeleccionada = {
      blob: new Blob(["foto"], { type: "image/jpeg" }),
      url: "blob:mock",
    };

    render(<FotoCoche foto={foto} onCambio={onCambio} />);

    await usuario.click(screen.getByRole("button", { name: /quitar foto/i }));

    expect(onCambio).toHaveBeenCalledWith(null);
  });

  it("ignora archivos que no son imágenes", async () => {
    const onCambio = vi.fn();
    const usuario = userEvent.setup();

    const { container } = render(
      <FotoCoche foto={null} onCambio={onCambio} />,
    );

    const input = container.querySelector<HTMLInputElement>(
      'input[type="file"]',
    );
    const archivo = new File(["texto"], "notas.txt", { type: "text/plain" });
    await usuario.upload(input as HTMLInputElement, archivo);

    expect(onCambio).not.toHaveBeenCalled();
  });
});
