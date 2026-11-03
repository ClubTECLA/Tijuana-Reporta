import { TIME_ZONE } from "@/features/reportes/reportFormat";
import type { ApiReporteResumen } from "@/types/api-types";

const hourFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: TIME_ZONE });
const dayFormat = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: TIME_ZONE });

/** "Buenas tardes, Bruce" según la hora de Tijuana, con el primer nombre; sin nombre, solo el saludo. */
export function saludo(username: string | undefined, now = Date.now()) {
    const hour = Number(hourFormat.format(now));
    const base = hour >= 5 && hour < 12 ? "Buenos días" : hour >= 12 && hour < 19 ? "Buenas tardes" : "Buenas noches";
    const nombre = username?.trim().split(/\s+/)[0];
    return nombre ? `${base}, ${nombre}` : base;
}

/** "Martes 16 de septiembre · Tijuana". */
export function fechaDeHoy(now = Date.now()) {
    const fecha = dayFormat.format(now).replace(",", "");
    return `${fecha.charAt(0).toUpperCase()}${fecha.slice(1)} · Tijuana`;
}

const createdTime = (reporte: ApiReporteResumen) => (reporte.created_at ? Date.parse(reporte.created_at) : NaN) || 0;

/**
 * Los `cantidad` más recientes, del más nuevo al más antiguo. El listado aún no trae created_at: mientras falte,
 * se respeta el orden del backend (sort es estable) y, en cuanto llegue, se ordena sin tocar nada más.
 */
export function masRecientes(reportes: ApiReporteResumen[], cantidad: number) {
    return [...reportes].sort((a, b) => createdTime(b) - createdTime(a)).slice(0, cantidad);
}
