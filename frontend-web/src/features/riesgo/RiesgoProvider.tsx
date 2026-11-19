import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/features/sesion/useAuth";
import { isOfficialRole } from "@/features/sesion/users";
import type { ApiMapaCalor, ApiResumenRiesgo, ApiZonaRiesgo } from "@/types/api-types";
import { obtenerMapaCalor, obtenerResumenRiesgo } from "./riesgo.services";
import { RiesgoContext, type RiesgoContextType, type VistaMapa } from "./RiesgoContext.ts";

const isAbort = (err: unknown) => err instanceof DOMException && err.name === "AbortError";

// Datos del riesgo para el panel "Riesgo" y la capa del mapa. El riesgo sale de los reportes históricos, que no
// cambian a cada momento: se carga al abrir el panel (no hay sondeo) y el mapa de calor al mover el mapa.
export function RiesgoProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const puedeVer = isOfficialRole(user?.rol_name);
    // El panel "Riesgo" avisa al abrirse y al cerrarse (ver RiesgoView): este provider está por encima del router de
    // paneles porque el panel se dibuja dentro de él.
    const [panelAbierto, setPanelAbierto] = useState(false);
    const [modoMapa, setModoMapa] = useState(false);
    const activo = puedeVer && (panelAbierto || modoMapa);
    // Abrir el panel termina el modo mapa: el panel vuelve a mandar.
    const cambiarPanelAbierto = useCallback((abierto: boolean) => {
        setPanelAbierto(abierto);
        if (abierto) setModoMapa(false);
    }, []);
    const verEnMapa = useCallback(() => setModoMapa(true), []);
    const salirModoMapa = useCallback(() => setModoMapa(false), []);

    const [resumen, setResumen] = useState<ApiResumenRiesgo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mapaCalor, setMapaCalor] = useState<ApiMapaCalor | null>(null);
    const [zonaEnfocada, setZonaEnfocada] = useState<ApiZonaRiesgo | null>(null);

    const resumenAbortRef = useRef<AbortController | null>(null);
    const mapaAbortRef = useRef<AbortController | null>(null);

    const refresh = useCallback(async () => {
        resumenAbortRef.current?.abort();
        const controller = new AbortController();
        resumenAbortRef.current = controller;
        try {
            const data = await obtenerResumenRiesgo(undefined, controller.signal);
            if (controller.signal.aborted) return;
            setResumen(data);
            setError(null);
        } catch (err) {
            if (isAbort(err) || controller.signal.aborted) return;
            setError(err instanceof Error ? err.message : "No se pudo cargar el riesgo.");
        }
    }, []);

    const cargarMapaCalor = useCallback((vista: VistaMapa) => {
        mapaAbortRef.current?.abort();
        const controller = new AbortController();
        mapaAbortRef.current = controller;
        obtenerMapaCalor(vista, controller.signal)
            .then((data) => { if (!controller.signal.aborted) setMapaCalor(data) })
            // El calor es un apoyo visual: si falla se conserva el último y el panel ya avisa de los errores del resumen.
            .catch(() => undefined);
    }, []);

    // Al abrir el panel se recarga el resumen (puede haber nuevos históricos); al cerrarlo se cancela lo pendiente.
    useEffect(() => {
        if (!activo) {
            resumenAbortRef.current?.abort();
            mapaAbortRef.current?.abort();
            return;
        }
        const id = setTimeout(() => { void refresh() }, 0);
        return () => clearTimeout(id);
    }, [activo, refresh]);

    // Otra sesión no debe ver los datos de la anterior.
    useEffect(() => {
        return () => {
            setResumen(null);
            setMapaCalor(null);
            setError(null);
            setZonaEnfocada(null);
            setModoMapa(false);
        };
    }, [user?.id]);

    const value = useMemo<RiesgoContextType>(() => ({
        puedeVer,
        activo,
        modoMapa,
        verEnMapa,
        salirModoMapa,
        resumen,
        error,
        mapaCalor,
        cargarMapaCalor,
        zonaEnfocada,
        enfocarZona: setZonaEnfocada,
        setPanelAbierto: cambiarPanelAbierto,
        refresh,
    }), [puedeVer, activo, modoMapa, verEnMapa, salirModoMapa, resumen, error, mapaCalor, cargarMapaCalor, zonaEnfocada, cambiarPanelAbierto, refresh]);

    return (
        <RiesgoContext.Provider value={value}>
            {children}
        </RiesgoContext.Provider>
    );
}
