import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/features/sesion/useAuth";
import { listarIncidentes } from "@/features/categorias/incidentes.services";
import { listarReportes } from "./reportes.services";
import { publicarReporte, subirFoto, type NuevoReporte } from "./publicarReporte";
import type { ApiIncidente, ApiReporteResumen } from "@/types/api-types";
import { DEFAULT_FILTERS, filterReportes, type ReportFilters } from "./reportFilters";
import { ReportesContext, type ReportesContextType } from "./ReportesContext.ts";

// Datos de incidentes compartidos por el panel "Incidentes", "Nuevo incidente" y la capa del mapa, para que haya
// una sola descarga y todos se actualicen a la vez (p. ej. al publicar un incidente nuevo).

// "En vivo": el backend no tiene websockets, así que se consulta cada cierto tiempo.
const POLL_INTERVAL_MS = 30_000;
// Tiempo que el pin de un incidente recién publicado se mantiene resaltado.
const CREATED_HIGHLIGHT_MS = 4_000;
// Mientras no llegan las categorías se expone un Map vacío y estable (la capa del mapa depende de su identidad).
const NO_CATEGORIES = new Map<number, ApiIncidente>();

export function ReportesProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();

    const [reportes, setReportes] = useState<ApiReporteResumen[] | null>(null);
    // null hasta que llegan por primera vez.
    const [categories, setCategories] = useState<Map<number, ApiIncidente> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS);
    const [createdId, setCreatedId] = useState<string | null>(null);
    const [lastSync, setLastSync] = useState<number | null>(null);

    // Firma de la última respuesta de cada lista: si no cambió, no se toca el estado y ni la lista ni el mapa se repintan.
    const reportesSignatureRef = useRef("");
    const categoriesSignatureRef = useRef("");
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
        const [reportResult, categoryResult] = await Promise.allSettled([
            listarReportes(),
            // También las inactivas: puede haber reportes de una categoría que ya se desactivó.
            listarIncidentes({ incluir_inactivos: true }),
        ]);
        if (!isCurrent()) return;

        // Cada lista se aplica por separado: si fallan los reportes, las categorías siguen llegando (Nuevo incidente
        // solo necesita esas), y al revés. Lo que falla conserva lo último que se cargó bien.
        if (reportResult.status === "fulfilled") {
            setLastSync(Date.now());
            const signature = JSON.stringify(reportResult.value);
            if (signature !== reportesSignatureRef.current) {
                reportesSignatureRef.current = signature;
                setReportes(reportResult.value);
            }
        }
        if (categoryResult.status === "fulfilled") {
            const signature = JSON.stringify(categoryResult.value);
            if (signature !== categoriesSignatureRef.current) {
                categoriesSignatureRef.current = signature;
                setCategories(new Map(categoryResult.value.map((category) => [category.id, category])));
            }
        }

        const failed = [reportResult, categoryResult].find((result) => result.status === "rejected");
        setError(failed
            ? (failed.reason instanceof Error ? failed.reason.message : "No se pudieron cargar los incidentes.")
            : null);
    }, []);

    const publicar = useCallback(async (nuevo: NuevoReporte) => {
        const publicacion = await publicarReporte(nuevo);
        // La lista y el mapa muestran el reporte nuevo, y su pin se anima.
        setCreatedId(publicacion.reporte.id);
        void refresh();
        return publicacion;
    }, [refresh]);

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
            reportesSignatureRef.current = "";
            categoriesSignatureRef.current = "";
            setReportes(null);
            setCategories(null);
            setError(null);
            setLastSync(null);
        };
    }, [isAuthenticated, refresh]);

    useEffect(() => {
        if (!createdId) return;
        const timeoutId = setTimeout(() => setCreatedId(null), CREATED_HIGHLIGHT_MS);
        return () => clearTimeout(timeoutId);
    }, [createdId]);

    // shortcut: con un periodo de 24 h o 7 días, "ahora" se toma al cambiar los datos o el filtro; recalcularlo con un
    // reloj cuando el backend envíe created_at y el periodo se active.
    const filteredReportes = useMemo(() => filterReportes(reportes ?? [], filters), [reportes, filters]);

    const value = useMemo<ReportesContextType>(() => ({
        reportes,
        categories: categories ?? NO_CATEGORIES,
        categoriesLoaded: categories !== null,
        error,
        filteredReportes,
        filters,
        setFilters,
        resetFilters: () => setFilters(DEFAULT_FILTERS),
        refresh,
        publicar,
        // La lista y el mapa no muestran fotos: reintentarla no necesita recargar nada.
        reintentarFoto: (reporteId, foto) => subirFoto(reporteId, foto),
        createdId,
        lastSync,
    }), [reportes, categories, error, filteredReportes, filters, refresh, publicar, createdId, lastSync]);

    return (
        <ReportesContext.Provider value={value}>
            {children}
        </ReportesContext.Provider>
    );
}
