import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { listIncidents } from "../../services/incidents.services";
import { listReports } from "../../services/reports.services";
import type { ApiIncidente, ApiReporteResumen } from "../../types/api-types";
import { filterReportes, type ReportFilters, type ReportTab, type StatusFilter } from "../../types/reportFilters";

// Datos de incidentes compartidos por el panel "Incidentes" y la capa del mapa, para que haya una sola
// descarga y ambos se actualicen a la vez (p. ej. al publicar un incidente nuevo).

// "En vivo": el backend no tiene websockets, así que se consulta cada cierto tiempo.
const POLL_INTERVAL_MS = 30_000;
// Tiempo que el pin de un incidente recién publicado se mantiene resaltado.
const CREATED_HIGHLIGHT_MS = 4_000;

interface ReportesContextType {
    reportes: ApiReporteResumen[] | null
    categories: Map<number, ApiIncidente>
    error: string | null
    /** Reportes que pasan los filtros del panel (pestaña y chips); los usan la lista y el mapa. */
    filteredReportes: ApiReporteResumen[]
    filters: ReportFilters
    setTab: (tab: ReportTab) => void
    toggleStatus: (status: StatusFilter) => void
    toggleOfficial: () => void
    refresh: () => Promise<void>
    /** Id del incidente recién publicado, para animar su pin; se limpia solo. */
    createdId: string | null
    markCreated: (id: string) => void
}

export const ReportesContext = createContext<ReportesContextType | undefined>(undefined);

export function ReportesProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();

    const [reportes, setReportes] = useState<ApiReporteResumen[] | null>(null);
    const [categories, setCategories] = useState<Map<number, ApiIncidente>>(new Map());
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<ReportFilters>({ tab: "activos", statusFilters: [], onlyOfficial: false });
    const [createdId, setCreatedId] = useState<string | null>(null);

    // Firma de la última respuesta: si no cambió, no se toca el estado y ni la lista ni el mapa se repintan.
    const lastSignatureRef = useRef("");
    // Sesión a la que pertenece cada petición: al cerrar sesión se incrementa y se descartan las respuestas
    // que lleguen después, para no restaurar los datos del usuario anterior.
    const sessionRef = useRef(0);
    // Pueden coincidir varias cargas (sondeo, volver a la pestaña, publicar o cambiar un estado): solo se aplica
    // la última que se pidió, para que una respuesta lenta y vieja no pise a una más nueva.
    const requestRef = useRef(0);

    const refresh = useCallback(async () => {
        const session = sessionRef.current;
        const request = ++requestRef.current;
        const isCurrent = () => session === sessionRef.current && request === requestRef.current;
        try {
            const [reportList, categoryList] = await Promise.all([
                listReports(),
                // También las inactivas: puede haber reportes de una categoría que ya se desactivó.
                listIncidents({ incluir_inactivos: true }),
            ]);
            if (!isCurrent()) return;
            setError(null);

            const signature = JSON.stringify([reportList, categoryList]);
            if (signature === lastSignatureRef.current) return;
            lastSignatureRef.current = signature;

            setReportes(reportList);
            setCategories(new Map(categoryList.map((category) => [category.id, category])));
        } catch (err) {
            if (!isCurrent()) return;
            setError(err instanceof Error ? err.message : "No se pudieron cargar los incidentes.");
        }
    }, []);

    // Carga al iniciar sesión, consulta periódica solo con la pestaña visible, y recarga al volver a ella.
    useEffect(() => {
        if (!isAuthenticated) {
            // Sesión cerrada: las peticiones que sigan en curso pertenecen a la anterior y se descartan.
            sessionRef.current++;
            return;
        }

        let intervalId: ReturnType<typeof setInterval> | undefined;
        const startPolling = () => {
            clearInterval(intervalId);
            intervalId = setInterval(() => { void refresh() }, POLL_INTERVAL_MS);
        };
        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                void refresh();
                startPolling();
            } else {
                clearInterval(intervalId);
            }
        };

        // Carga inicial fuera del cuerpo del efecto (refresh actualiza el estado al llegar la respuesta).
        // Siempre se carga una vez, pero el sondeo solo empieza si la pestaña está visible; si no, al volver a ella.
        const initialLoadId = setTimeout(() => { void refresh() }, 0);
        if (document.visibilityState === "visible") startPolling();
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            clearTimeout(initialLoadId);
            clearInterval(intervalId);
            document.removeEventListener("visibilitychange", handleVisibility);
            // Al cerrar sesión no deben quedar datos del usuario anterior.
            lastSignatureRef.current = "";
            setReportes(null);
            setCategories(new Map());
            setError(null);
        };
    }, [isAuthenticated, refresh]);

    useEffect(() => {
        if (!createdId) return;
        const timeoutId = setTimeout(() => setCreatedId(null), CREATED_HIGHLIGHT_MS);
        return () => clearTimeout(timeoutId);
    }, [createdId]);

    const filteredReportes = useMemo(() => filterReportes(reportes ?? [], filters), [reportes, filters]);

    const value = useMemo<ReportesContextType>(() => ({
        reportes,
        categories,
        error,
        filteredReportes,
        filters,
        setTab: (tab) => setFilters((prev) => ({ ...prev, tab })),
        toggleStatus: (status) => setFilters((prev) => ({
            ...prev,
            statusFilters: prev.statusFilters.includes(status)
                ? prev.statusFilters.filter((s) => s !== status)
                : [...prev.statusFilters, status],
        })),
        toggleOfficial: () => setFilters((prev) => ({ ...prev, onlyOfficial: !prev.onlyOfficial })),
        refresh,
        createdId,
        markCreated: setCreatedId,
    }), [reportes, categories, error, filteredReportes, filters, refresh, createdId]);

    return (
        <ReportesContext.Provider value={value}>
            {children}
        </ReportesContext.Provider>
    );
}
