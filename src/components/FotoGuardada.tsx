import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { leerFoto } from "../storage/indexedDb";

type Props = {
  fotoId: string;
};

export function FotoGuardada({ fotoId }: Props) {
  const { t } = useTranslation();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    let objectUrl: string | null = null;

    leerFoto(fotoId)
      .then((foto) => {
        if (!activo || foto === null) return;
        objectUrl = URL.createObjectURL(foto.blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (activo) setUrl(null);
      });

    return () => {
      activo = false;
      if (objectUrl !== null) URL.revokeObjectURL(objectUrl);
    };
  }, [fotoId]);

  if (url === null) return null;

  return <img className="registro__foto" src={url} alt={t("foto.alt")} />;
}
