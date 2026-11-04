import { useEffect, useState } from "react";

/**
 * Devuelve la hora actual (epoch ms) y la refresca cada `intervaloMs`.
 * También se actualiza al volver a la pestaña para corregir el desfase
 * que provoca la ralentización de timers en segundo plano.
 */
export function useAhora(intervaloMs = 1000): number {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setAhora(Date.now()), intervaloMs);

    const alHacerseVisible = () => {
      if (!document.hidden) setAhora(Date.now());
    };
    document.addEventListener("visibilitychange", alHacerseVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", alHacerseVisible);
    };
  }, [intervaloMs]);

  return ahora;
}
