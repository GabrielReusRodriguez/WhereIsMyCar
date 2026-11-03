import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "../i18n";
import { FormularioParking } from "./FormularioParking";

describe("FormularioParking", () => {
  it("envía planta, zona y plaza", async () => {
    const onGuardar = vi.fn();
    const usuario = userEvent.setup();

    render(<FormularioParking onGuardar={onGuardar} onCancelar={() => {}} />);

    await usuario.type(screen.getByLabelText(/planta/i), "-2");
    await usuario.type(screen.getByLabelText(/zona/i), "A");
    await usuario.type(screen.getByLabelText(/plaza/i), "42");
    await usuario.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onGuardar).toHaveBeenCalledWith({
      tipo: "parking",
      planta: "-2",
      zona: "A",
      plaza: "42",
    });
  });

  it("omite la zona si está vacía", async () => {
    const onGuardar = vi.fn();
    const usuario = userEvent.setup();

    render(<FormularioParking onGuardar={onGuardar} onCancelar={() => {}} />);

    await usuario.type(screen.getByLabelText(/planta/i), "3");
    await usuario.type(screen.getByLabelText(/plaza/i), "12");
    await usuario.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onGuardar).toHaveBeenCalledWith({
      tipo: "parking",
      planta: "3",
      plaza: "12",
    });
  });

  it("muestra un error si faltan campos obligatorios", async () => {
    const onGuardar = vi.fn();
    const usuario = userEvent.setup();

    render(<FormularioParking onGuardar={onGuardar} onCancelar={() => {}} />);

    await usuario.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onGuardar).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Rellena los campos obligatorios.",
    );
  });
});
