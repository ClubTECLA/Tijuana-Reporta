import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/features/sesion/useAuth";
import type { ApiCentro, ApiCrearCentroRequest, ApiTipoCentro } from "@/types/api-types";
import { crearCentro, listarCentros, listarTiposCentro } from "./centros.services";
import { DEFAULT_CENTRO_FILTERS, filterCentros, type CentroFilters } from "./centroFormat";
import { CentrosContext, type CentrosContextType } from "./CentrosContext.ts";

// Datos de centros compartidos por el panel "Centros", su detalle, "Nuevo centro" y la capa del mapa: una sola
// descarga y todos se actualizan a la vez. Sin sondeo, a diferencia de los reportes: los centros cambian poco y
// solo desde aquí; se recargan al iniciar sesión y al crear uno.

// Mientras no llegan los tipos se expone un Map vacío y estable.
const NO_TIPOS = new Map<number, ApiTipoCentro>();

export function CentrosProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();

    const [centros, setCentros] = useState<ApiCentro[] | null>(null);
    const [tipos, setTipos] = useState<Map<number, ApiTipoCentro>>(NO_TIPOS);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<CentroFilters>(DEFAULT_CENTRO_FILTERS);

    // Igual que ReportesProvider: al cerrar sesión se descartan las respuestas que lleguen tarde, y entre cargas que
    // coinciden solo se aplica la última.
    const sessionRef = useRef(0);
    const requestRef = useRef(0);

    const refresh = useCallback(async () => {
        const session = sessionRef.current;
        const request = ++requestRef.current;
        const [centroResult, tipoResult] = await Promise.allSettled([listarCentros(), listarTiposCentro()]);
        if (session !== sessionRef.current || request !== requestRef.current) return;

        // Cada lista por separado: si falla una, la otra se aplica y lo que falla conserva lo último que se cargó bien.
        if (centroResult.status === "fulfilled") setCentros(centroResult.value);
        if (tipoResult.status === "fulfilled") setTipos(new Map(tipoResult.value.map((tipo) => [tipo.id, tipo])));

        const failed = [centroResult, tipoResult].find((result) => result.status === "rejected");
        setError(failed
            ? (failed.reason instanceof Error ? failed.reason.message : "No se pudieron cargar los centros.")
            : null);
    }, []);

    const crear = useCallback(async (nuevo: ApiCrearCentroRequest) => {
        const centro = await crearCentro(nuevo);
        // Se añade ya el que devolvió el POST: si la recarga falla, su detalle (que se abre al publicar) lo encuentra
        // igual. Si la recarga sale bien, la lista del servidor lo sustituye.
        setCentros((prev) => [...(prev ?? []).filter((item) => item.id !== centro.id), centro]);
        // Sin filtros, para que la lista y el mapa muestren el centro nuevo.
        setFilters(DEFAULT_CENTRO_FILTERS);
        await refresh();
        return centro;
    }, [refresh]);

    useEffect(() => {
        if (!isAuthenticated) {
            sessionRef.current++;
            return;
        }
        // Carga inicial fuera del cuerpo del efecto (refresh actualiza el estado al llegar la respuesta).
        const initialLoadId = setTimeout(() => { void refresh() }, 0);
        return () => {
            clearTimeout(initialLoadId);
            // Al cerrar sesión no deben quedar datos del usuario anterior.
            setCentros(null);
            setTipos(NO_TIPOS);
            setError(null);
        };
    }, [isAuthenticated, refresh]);

    const filteredCentros = useMemo(() => filterCentros(centros ?? [], filters), [centros, filters]);

    const value = useMemo<CentrosContextType>(() => ({
        centros,
        tipos,
        error,
        filteredCentros,
        filters,
        setFilters,
        refresh,
        crear,
    }), [centros, tipos, error, filteredCentros, filters, refresh, crear]);

    return (
        <CentrosContext.Provider value={value}>
            {children}
        </CentrosContext.Provider>
    );
}
