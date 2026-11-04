import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "../i18n";
import { FormularioParking } from "./FormularioParking";

const COORDS = { latitude: 41.3874, longitude: 2.1686 };

function mockUbicacion() {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: (exito: PositionCallback) =>
        exito({ coords: COORDS } as GeolocationPosition),
    },
  });
}

function renderFormulario() {
  const onGuardar = vi.fn();
  const usuario = userEvent.setup();
  render(<FormularioParking onGuardar={onGuardar} onCancelar={() => {}} />);
  return { onGuardar, usuario };
}

describe("FormularioParking", () => {
  beforeEach(() => {
    mockUbicacion();
  });

  it("envía planta, zona y plaza", async () => {
    const { onGuardar, usuario } = renderFormulario();

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
    const { onGuardar, usuario } = renderFormulario();

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
    const { onGuardar, usuario } = renderFormulario();

    await usuario.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onGuardar).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Rellena los campos obligatorios.",
    );
  });

  it("oculta la ubicación por defecto", () => {
    renderFormulario();

    expect(
      screen.getByRole("button", { name: /añadir ubicación/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /usar mi ubicación/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^calle/i)).not.toBeInTheDocument();
  });

  it("despliega la sección de ubicación al pulsar el enlace", async () => {
    const { usuario } = renderFormulario();

    await usuario.click(
      screen.getByRole("button", { name: /añadir ubicación/i }),
    );

    expect(
      screen.getByRole("radio", { name: /dirección/i }),
    ).toBeChecked();
    expect(screen.getByLabelText(/^calle/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^número/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^ciudad/i)).toBeInTheDocument();
  });

  it("guarda la dirección del parking indicada", async () => {
    const { onGuardar, usuario } = renderFormulario();

    await usuario.type(screen.getByLabelText(/planta/i), "-2");
    await usuario.type(screen.getByLabelText(/plaza/i), "42");
    await usuario.click(
      screen.getByRole("button", { name: /añadir ubicación/i }),
    );
    await usuario.click(
      screen.getByRole("radio", { name: /dirección/i }),
    );
    await usuario.type(screen.getByLabelText(/^calle/i), "Gran Via");
    await usuario.type(screen.getByLabelText(/^número/i), "10");
    await usuario.type(screen.getByLabelText(/^ciudad/i), "Barcelona");
    await usuario.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onGuardar).toHaveBeenCalledWith({
      tipo: "parking",
      planta: "-2",
      plaza: "42",
      ubicacion: {
        modo: "direccion",
        direccion: { calle: "Gran Via", numero: "10", ciudad: "Barcelona" },
      },
    });
  });

  it("guarda las coordenadas GPS del parking", async () => {
    const { onGuardar, usuario } = renderFormulario();

    await usuario.type(screen.getByLabelText(/planta/i), "-2");
    await usuario.type(screen.getByLabelText(/plaza/i), "42");
    await usuario.click(
      screen.getByRole("button", { name: /añadir ubicación/i }),
    );
    await usuario.click(
      screen.getByRole("radio", { name: /coordenadas gps/i }),
    );
    await usuario.click(
      screen.getByRole("button", { name: /usar mi ubicación/i }),
    );
    await screen.findByText(/ubicación obtenida/i);
    await usuario.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onGuardar).toHaveBeenCalledWith({
      tipo: "parking",
      planta: "-2",
      plaza: "42",
      ubicacion: { modo: "gps", gps: { lat: 41.3874, lng: 2.1686 } },
    });
  });

  it("exige ubicación si la sección está abierta", async () => {
    const { onGuardar, usuario } = renderFormulario();

    await usuario.type(screen.getByLabelText(/planta/i), "-2");
    await usuario.type(screen.getByLabelText(/plaza/i), "42");
    await usuario.click(
      screen.getByRole("button", { name: /añadir ubicación/i }),
    );
    await usuario.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onGuardar).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Rellena los campos obligatorios.",
    );
  });

  it("quitar la ubicación oculta la sección y guarda sin ella", async () => {
    const { onGuardar, usuario } = renderFormulario();

    await usuario.type(screen.getByLabelText(/planta/i), "-2");
    await usuario.type(screen.getByLabelText(/plaza/i), "42");
    await usuario.click(
      screen.getByRole("button", { name: /añadir ubicación/i }),
    );
    await usuario.click(
      screen.getByRole("button", { name: /quitar ubicación/i }),
    );

    expect(screen.queryByLabelText(/^calle/i)).not.toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onGuardar).toHaveBeenCalledWith({
      tipo: "parking",
      planta: "-2",
      plaza: "42",
    });
  });
});
