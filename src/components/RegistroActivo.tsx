import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Aparcamiento, Direccion } from "../types/aparcamiento";
import { useAhora } from "../hooks/useAhora";
import { formatearDuracion, formatearFecha } from "../utils/fecha";
import { formatearCoordenadas, urlGoogleMaps } from "../utils/googleMaps";
import { DialogoConfirmacion } from "./DialogoConfirmacion";
import { FotoGuardada } from "./FotoGuardada";
import type { Idioma } from "../i18n";

type Props = {
  aparcamiento: Aparcamiento;
  onRecoger: () => void;
};

function formatearDireccion(direccion: Direccion): string {
  const base = `${direccion.calle} ${direccion.numero}`;
  return direccion.ciudad === undefined ? base : `${base}, ${direccion.ciudad}`;
}

export function RegistroActivo({ aparcamiento, onRecoger }: Props) {
  const { t, i18n } = useTranslation();
  const [confirmando, setConfirmando] = useState(false);
  const ahora = useAhora();
  const idioma: Idioma = i18n.language === "ca" ? "ca" : "es";

  const confirmar = () => {
    setConfirmando(false);
    void onRecoger();
  };

  return (
    <section className="registro" aria-labelledby="registro-titulo">
      <p className="registro__etiqueta">{t("guardado.titulo")}</p>
      <h2 id="registro-titulo" className="registro__tipo">
        {aparcamiento.tipo === "parking"
          ? t("guardado.tipoParking")
          : t("guardado.tipoCalle")}
      </h2>
      <p className="registro__hora">
        {t("guardado.hora", {
          fecha: formatearFecha(aparcamiento.guardadoEn, idioma),
        })}
      </p>
      <p className="registro__tiempo" role="timer">
        {t("guardado.tiempoTranscurrido", {
          tiempo: formatearDuracion(ahora - aparcamiento.guardadoEn, idioma),
        })}
      </p>

      {aparcamiento.fotoId !== undefined && (
        <FotoGuardada fotoId={aparcamiento.fotoId} />
      )}

      {aparcamiento.tipo === "parking" && (
        <>
          <dl className="registro__datos">
            <div className="registro__dato">
              <dt>{t("parking.planta")}</dt>
              <dd>{aparcamiento.planta}</dd>
            </div>
            {aparcamiento.zona !== undefined && (
              <div className="registro__dato">
                <dt>{t("parking.zona")}</dt>
                <dd>{aparcamiento.zona}</dd>
              </div>
            )}
            <div className="registro__dato">
              <dt>{t("parking.plaza")}</dt>
              <dd>{aparcamiento.plaza}</dd>
            </div>
            {aparcamiento.ubicacion?.modo === "direccion" && (
              <div className="registro__dato registro__dato--ancho">
                <dt>{t("guardado.direccion")}</dt>
                <dd>{formatearDireccion(aparcamiento.ubicacion.direccion)}</dd>
              </div>
            )}
            {aparcamiento.ubicacion?.modo === "gps" && (
              <div className="registro__dato registro__dato--ancho">
                <dt>{t("guardado.coordenadas")}</dt>
                <dd>
                  {formatearCoordenadas(
                    aparcamiento.ubicacion.gps.lat,
                    aparcamiento.ubicacion.gps.lng,
                  )}
                </dd>
              </div>
            )}
          </dl>

          {aparcamiento.ubicacion?.modo === "gps" && (
            <a
              className="boton boton--secundario"
              href={urlGoogleMaps(
                aparcamiento.ubicacion.gps.lat,
                aparcamiento.ubicacion.gps.lng,
              )}
              target="_blank"
              rel="noreferrer"
            >
              {t("guardado.verEnMaps")}
            </a>
          )}
        </>
      )}

      {aparcamiento.tipo === "calle" && (
        <>
          <dl className="registro__datos">
            {aparcamiento.modo !== "gps" && (
              <div className="registro__dato registro__dato--ancho">
                <dt>{t("guardado.direccion")}</dt>
                <dd>{formatearDireccion(aparcamiento.direccion)}</dd>
              </div>
            )}
            <div className="registro__dato">
              <dt>{t("guardado.pago")}</dt>
              <dd>
                {aparcamiento.dePago
                  ? t("guardado.pagoSi")
                  : t("guardado.pagoNo")}
              </dd>
            </div>
            {aparcamiento.modo !== "direccion" && (
              <div className="registro__dato registro__dato--ancho">
                <dt>{t("guardado.coordenadas")}</dt>
                <dd>
                  {formatearCoordenadas(
                    aparcamiento.gps.lat,
                    aparcamiento.gps.lng,
                  )}
                </dd>
              </div>
            )}
          </dl>

          {aparcamiento.modo !== "direccion" && (
            <a
              className="boton boton--secundario"
              href={urlGoogleMaps(aparcamiento.gps.lat, aparcamiento.gps.lng)}
              target="_blank"
              rel="noreferrer"
            >
              {t("guardado.verEnMaps")}
            </a>
          )}
        </>
      )}

      <button
        type="button"
        className="boton boton--peligro"
        onClick={() => setConfirmando(true)}
      >
        {t("guardado.recoger")}
      </button>

      <DialogoConfirmacion
        abierto={confirmando}
        titulo={t("guardado.confirmarTitulo")}
        texto={t("guardado.confirmarTexto")}
        etiquetaConfirmar={t("guardado.confirmarSi")}
        etiquetaCancelar={t("guardado.confirmarNo")}
        onConfirmar={confirmar}
        onCancelar={() => setConfirmando(false)}
      />
    </section>
  );
}
