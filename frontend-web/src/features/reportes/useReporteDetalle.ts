import { useCallback, useEffect, useState } from "react";
import { cambiarEstadoReporte, crearComentario, obtenerReporte } from "./reportes.services";
import { useReportes } from "./useReportes";
import type { ApiEstadoReporte, ApiReporte } from "@/types/api-types";

/**
 * Detalle completo de un reporte para su panel: lo carga, publica comentarios y cambia su estado.
 * Las respuestas que llegan después de cerrar el panel se descartan.
 */
export function useReporteDetalle(reporteId: string) {
    const { refresh } = useReportes();
    const [reporte, setReporte] = useState<ApiReporte | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        obtenerReporte(reporteId)
            .then((data) => { if (!cancelled) setReporte(data) })
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

    /** Cambia el estado (solo roles oficiales); si falla, lanza el error para que la vista lo muestre. */
    const cambiarEstado = useCallback(async (estado: ApiEstadoReporte) => {
        setReporte(await cambiarEstadoReporte(reporteId, estado));
        // La lista y el pin del mapa también muestran el estado.
        void refresh();
    }, [reporteId, refresh]);

    return { reporte, error, comentar, cambiarEstado };
}
