import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "../i18n";
import { FormularioCalle } from "./FormularioCalle";

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

function mockErrorUbicacion(code: number) {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: (_exito: PositionCallback, error: PositionErrorCallback) =>
        error({
          code,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError),
    },
  });
}

function renderFormulario() {
  const onGuardar = vi.fn();
  const usuario = userEvent.setup();
  render(<FormularioCalle onGuardar={onGuardar} onCancelar={() => {}} />);
  return { onGuardar, usuario };
}

describe("FormularioCalle", () => {
  beforeEach(() => {
    mockUbicacion();
  });

  it("guarda en modo completo con GPS y dirección", async () => {
    const { onGuardar, usuario } = renderFormulario();

    await usuario.type(screen.getByLabelText(/^calle/i), "Gran Via");
    await usuario.type(screen.getByLabelText(/^número/i), "10");
    await usuario.type(screen.getByLabelText(/ciudad/i), "Barcelona");
    await usuario.click(
      screen.getByRole("button", { name: /usar mi ubicación/i }),
    );
    await screen.findByText(/ubicación obtenida/i);
    await usuario.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onGuardar).toHaveBeenCalledWith({
      tipo: "calle",
      modo: "completo",
      gps: { lat: 41.3874, lng: 2.1686 },
      direccion: { calle: "Gran Via", numero: "10", ciudad: "Barcelona" },
      dePago: false,
    });
  });

  it("guarda solo con GPS sin pedir dirección", async () => {
    const { onGuardar, usuario } = renderFormulario();

    await usuario.click(
      screen.getByRole("radio", { name: /solo ubicación gps/i }),
    );
    expect(screen.queryByLabelText(/^calle/i)).not.toBeInTheDocument();

    await usuario.click(
      screen.getByRole("button", { name: /usar mi ubicación/i }),
    );
    await screen.findByText(/ubicación obtenida/i);
    await usuario.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onGuardar).toHaveBeenCalledWith({
      tipo: "calle",
      modo: "gps",
      gps: { lat: 41.3874, lng: 2.1686 },
      dePago: false,
    });
  });

  it("guarda solo con dirección sin GPS", async () => {
    const { onGuardar, usuario } = renderFormulario();

    await usuario.click(
      screen.getByRole("radio", { name: /solo calle y número/i }),
    );
    expect(
      screen.queryByRole("button", { name: /usar mi ubicación/i }),
    ).not.toBeInTheDocument();

    await usuario.type(screen.getByLabelText(/^calle/i), "Gran Via");
    await usuario.type(screen.getByLabelText(/^número/i), "10");
    await usuario.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onGuardar).toHaveBeenCalledWith({
      tipo: "calle",
      modo: "direccion",
      direccion: { calle: "Gran Via", numero: "10" },
      dePago: false,
    });
  });

  it("no guarda en modo GPS si falta la ubicación", async () => {
    const { onGuardar, usuario } = renderFormulario();

    await usuario.click(
      screen.getByRole("radio", { name: /solo ubicación gps/i }),
    );
    await usuario.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onGuardar).not.toHaveBeenCalled();
    expect(
      screen.getByText(/obtén tu ubicación gps antes de guardar/i),
    ).toBeInTheDocument();
  });

  it("no guarda en modo dirección sin calle ni número", async () => {
    const { onGuardar, usuario } = renderFormulario();

    await usuario.click(
      screen.getByRole("radio", { name: /solo calle y número/i }),
    );
    await usuario.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onGuardar).not.toHaveBeenCalled();
    expect(
      screen.getByText(/rellena los campos obligatorios/i),
    ).toBeInTheDocument();
  });

  it("marca el aparcamiento como de pago", async () => {
    const { onGuardar, usuario } = renderFormulario();

    await usuario.click(
      screen.getByRole("radio", { name: /solo calle y número/i }),
    );
    await usuario.type(screen.getByLabelText(/^calle/i), "Gran Via");
    await usuario.type(screen.getByLabelText(/^número/i), "10");
    await usuario.click(screen.getByRole("radio", { name: /^sí$/i }));
    await usuario.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onGuardar).toHaveBeenCalledWith(
      expect.objectContaining({ dePago: true }),
    );
  });

  it("muestra el error cuando se deniega el permiso", async () => {
    mockErrorUbicacion(1);
    const { usuario } = renderFormulario();

    await usuario.click(
      screen.getByRole("button", { name: /usar mi ubicación/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /revisa los permisos/i,
    );
  });
});
