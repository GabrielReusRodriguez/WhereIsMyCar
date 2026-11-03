import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "../i18n";
import type { AparcamientoCalle, AparcamientoParking } from "../types/aparcamiento";
import { RegistroActivo } from "./RegistroActivo";

const parking: AparcamientoParking = {
  id: "p1",
  tipo: "parking",
  guardadoEn: new Date(2024, 4, 1, 10, 30).getTime(),
  planta: "-2",
  zona: "A",
  plaza: "42",
};

const calleCompleta: AparcamientoCalle = {
  id: "c1",
  tipo: "calle",
  modo: "completo",
  guardadoEn: new Date(2024, 4, 1, 10, 30).getTime(),
  gps: { lat: 41.3874, lng: 2.1686 },
  direccion: { calle: "Gran Via", numero: "10", ciudad: "Barcelona" },
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
      screen.getByText(/se marcará el coche como recogido/i),
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

  it("muestra dirección, pago, coordenadas y enlace en modo completo", () => {
    render(<RegistroActivo aparcamiento={calleCompleta} onRecoger={vi.fn()} />);

    expect(screen.getByText("Gran Via 10, Barcelona")).toBeInTheDocument();
    expect(screen.getByText("Sí")).toBeInTheDocument();
    expect(screen.getByText("41.38740, 2.16860")).toBeInTheDocument();

    const enlace = screen.getByRole("link", { name: /google maps/i });
    expect(enlace).toHaveAttribute(
      "href",
      "https://www.google.com/maps?q=41.3874,2.1686",
    );
  });

  it("en modo solo GPS no muestra dirección", () => {
    const soloGps: AparcamientoCalle = {
      id: "c2",
      tipo: "calle",
      modo: "gps",
      guardadoEn: calleCompleta.guardadoEn,
      gps: { lat: 41.3874, lng: 2.1686 },
      dePago: false,
    };

    render(<RegistroActivo aparcamiento={soloGps} onRecoger={vi.fn()} />);

    expect(screen.queryByText("Dirección")).not.toBeInTheDocument();
    expect(screen.getByText("41.38740, 2.16860")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /google maps/i }),
    ).toBeInTheDocument();
  });

  it("en modo solo dirección no muestra coordenadas ni enlace", () => {
    const soloDireccion: AparcamientoCalle = {
      id: "c3",
      tipo: "calle",
      modo: "direccion",
      guardadoEn: calleCompleta.guardadoEn,
      direccion: { calle: "Gran Via", numero: "10" },
      dePago: false,
    };

    render(<RegistroActivo aparcamiento={soloDireccion} onRecoger={vi.fn()} />);

    expect(screen.getByText("Gran Via 10")).toBeInTheDocument();
    expect(screen.queryByText("Coordenadas")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /google maps/i }),
    ).not.toBeInTheDocument();
  });
});
