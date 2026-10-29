import { useCallback, useEffect, useState } from "react";
import { crearComentario, obtenerReporte } from "./reportes.services";
import { direccionDe } from "../mapa/geocoding.services";
import type { ApiReporte } from "../types/api-types";

/**
 * Detalle completo de un reporte para su panel: lo carga, busca su dirección aproximada y publica comentarios.
 * Las respuestas que llegan después de cerrar el panel se descartan.
 */
export function useReporteDetalle(reporteId: string) {
    const [reporte, setReporte] = useState<ApiReporte | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [address, setAddress] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        obtenerReporte(reporteId)
            .then((data) => {
                if (cancelled) return;
                setReporte(data);
                // La dirección es solo informativa: si Nominatim falla se muestran las coordenadas.
                direccionDe(data.latitude, data.longitude)
                    .then((found) => { if (!cancelled) setAddress(found) })
                    .catch(() => undefined);
            })
            .catch((err: unknown) => {
                if (!cancelled) setError(err instanceof Error ? err.message : "No se pudo cargar el incidente.");
            });

        return () => { cancelled = true };
    }, [reporteId]);

    /** Publica un comentario y lo añade al detalle; si falla, lanza el error para que la vista lo muestre. */
    const comentar = useCallback(async (texto: string) => {
        const created = await crearComentario(reporteId, texto);
        setReporte((prev) => prev && { ...prev, comentarios: [...prev.comentarios, created] });
    }, [reporteId]);

    return { reporte, error, address, comentar };
}
