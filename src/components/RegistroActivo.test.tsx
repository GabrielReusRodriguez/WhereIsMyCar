import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "../i18n";
import type { AparcamientoCalle, AparcamientoParking } from "../types/aparcamiento";
import { RegistroActivo } from "./RegistroActivo";

const parking: AparcamientoParking = {
  id: "activo",
  tipo: "parking",
  guardadoEn: new Date(2024, 4, 1, 10, 30).getTime(),
  planta: "-2",
  zona: "A",
  plaza: "42",
};

const calle: AparcamientoCalle = {
  id: "activo",
  tipo: "calle",
  guardadoEn: new Date(2024, 4, 1, 10, 30).getTime(),
  calle: "Gran Via",
  numero: "10",
  ciudad: "Barcelona",
  lat: 41.3874,
  lng: 2.1686,
  dePago: true,
};

describe("RegistroActivo", () => {
  it("muestra los datos del parking", () => {
    render(<RegistroActivo aparcamiento={parking} onRecoger={vi.fn()} />);

    expect(screen.getByText("-2")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("pide confirmación antes de recoger el coche", async () => {
    const onRecoger = vi.fn();
    const usuario = userEvent.setup();

    render(<RegistroActivo aparcamiento={parking} onRecoger={onRecoger} />);

    await usuario.click(
      screen.getByRole("button", { name: /^he recogido el coche$/i }),
    );
    expect(
      screen.getByText(/se eliminará el aparcamiento/i),
    ).toBeInTheDocument();

    await usuario.click(
      screen.getByRole("button", { name: /sí, he recogido el coche/i }),
    );

    expect(onRecoger).toHaveBeenCalledTimes(1);
  });

  it("no recoge el coche si se cancela", async () => {
    const onRecoger = vi.fn();
    const usuario = userEvent.setup();

    render(<RegistroActivo aparcamiento={parking} onRecoger={onRecoger} />);

    await usuario.click(
      screen.getByRole("button", { name: /^he recogido el coche$/i }),
    );
    await usuario.click(screen.getByRole("button", { name: /^cancelar$/i }));

    expect(onRecoger).not.toHaveBeenCalled();
  });

  it("muestra la dirección, el pago y el enlace a Google Maps", () => {
    render(<RegistroActivo aparcamiento={calle} onRecoger={vi.fn()} />);

    expect(screen.getByText("Gran Via 10, Barcelona")).toBeInTheDocument();
    expect(screen.getByText("Sí")).toBeInTheDocument();

    const enlace = screen.getByRole("link", { name: /google maps/i });
    expect(enlace).toHaveAttribute(
      "href",
      "https://www.google.com/maps?q=41.3874,2.1686",
    );
  });

  it("muestra la dirección sin ciudad si no se indicó", () => {
    const sinCiudad: AparcamientoCalle = { ...calle };
    delete sinCiudad.ciudad;

    render(<RegistroActivo aparcamiento={sinCiudad} onRecoger={vi.fn()} />);

    expect(screen.getByText("Gran Via 10")).toBeInTheDocument();
  });
});
