import type { ApiEstadoReporte } from "@/types/api-types";

// Formatos de presentación de un reporte, compartidos por la lista y el detalle.

// Cómo se distingue cada estado en el icono del incidente; Pendiente y Verificado conservan el color de su categoría.
// Son colores fijos: sobre un color de categoría cualquiera no se puede garantizar el contraste (ver index.css).
const STATUS_COLORS: Partial<Record<ApiEstadoReporte, { background: string; border: string; icon: string }>> = {
    Probable: { background: "var(--color-probable-muted)", border: "var(--color-probable)", icon: "var(--color-probable-icon)" },
    Resuelto: { background: "var(--color-resolved-muted)", border: "var(--color-resolved)", icon: "var(--color-resolved-icon)" },
    Descartado: { background: "var(--color-discarded-muted)", border: "var(--color-discarded)", icon: "var(--color-discarded-icon)" },
};

// Por encima de esta luminancia, un dibujo blanco queda por debajo de un contraste de 3:1.
const WHITE_ICON_MAX_LUMINANCE = 0.3;

/** Contorno del icono de un incidente pendiente, para que no se confunda con uno verificado. */
export const PENDING_ICON_STYLE = "outline-2 outline-offset-2 outline-dashed outline-ink-muted";

/** Luminancia relativa (WCAG) de un color #RRGGBB; 0 si tiene otro formato. */
function luminance(hex: string) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return 0;
    const [r, g, b] = [1, 3, 5]
        .map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
        .map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Fondo del icono de un incidente: el de su estado, o el de su categoría si el estado no tiene uno propio. */
export function incidentColor(estado: ApiEstadoReporte, categoryColor = "#757575") {
    return STATUS_COLORS[estado]?.background ?? categoryColor;
}

/** Borde del icono de un incidente según su estado; sin uno propio, undefined deja el borde del componente. */
export function incidentBorderColor(estado: ApiEstadoReporte) {
    return STATUS_COLORS[estado]?.border;
}

/** Color del dibujo del icono: el de su estado o, sobre una categoría clara, oscuro; undefined lo deja blanco. */
export function incidentIconColor(estado: ApiEstadoReporte, categoryColor = "") {
    return STATUS_COLORS[estado]?.icon ?? (luminance(categoryColor) > WHITE_ICON_MAX_LUMINANCE ? "var(--color-ink)" : undefined);
}

/** Folio corto derivado del id, con la misma fórmula que codigoReporte() de mobile. Solo presentación. */
export function folio(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 9000;
    return `INC-${hash + 1000}`;
}

/** "1 confirmación", "3 confirmaciones". */
export function confirmaciones(avistamientos: number) {
    return `${avistamientos} ${avistamientos === 1 ? "confirmación" : "confirmaciones"}`;
}

/** URL pública de una foto guardada: la sirve nginx fuera de /api (en desarrollo, el proxy de Vite). */
export function fotoUrl(path: string) {
    return `/multimedia/${path.split("/").map(encodeURIComponent).join("/")}`;
}

// Las fechas se muestran en la hora de Tijuana aunque el navegador tenga otra zona horaria.
export const TIME_ZONE = "America/Tijuana";
const dateTimeFormat = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: TIME_ZONE });
// "always": "hace 1 mes" y no "el mes pasado", porque timeAgo mide tiempo transcurrido, no meses ni días del calendario.
const relativeFormat = new Intl.RelativeTimeFormat("es", { numeric: "always" });

/** Milisegundos de una fecha ISO del backend, o NaN si no es válida. */
const timeOf = (iso: string) => Date.parse(iso);

/** "17 oct 2026, 14:21"; con una fecha inválida, un guion en lugar de lanzar RangeError. */
export function formatDateTime(iso: string) {
    const time = timeOf(iso);
    return Number.isNaN(time) ? "—" : dateTimeFormat.format(time);
}

// De la unidad más grande a la más pequeña; los meses y años son aproximados (30 y 365 días), como en mobile.
const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
];

// "2026-10-31": el día de calendario en Tijuana, comparable como texto.
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: TIME_ZONE });
const hourFormat = new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TIME_ZONE });
const dayMonthFormat = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: TIME_ZONE });
const dayMonthYearFormat = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: TIME_ZONE });

/**
 * Fecha corta para la fila de un incidente: "hoy 14:36", "ayer 09:10", "28 oct" o, de otro año, "28 oct 2025".
 * Con una fecha inválida, "".
 */
export function shortDate(iso: string, now = Date.now()) {
    const time = timeOf(iso);
    if (Number.isNaN(time)) return "";
    const day = dayKeyFormat.format(time);
    const today = dayKeyFormat.format(now);
    // Ayer se calcula sobre el calendario y no restando 24 h, que fallaría el día del cambio de horario.
    const [y, m, d] = today.split("-").map(Number);
    const yesterday = new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);

    if (day === today) return `hoy ${hourFormat.format(time)}`;
    if (day === yesterday) return `ayer ${hourFormat.format(time)}`;
    return (day.slice(0, 4) === today.slice(0, 4) ? dayMonthFormat : dayMonthYearFormat).format(time).replace(".", "");
}

/** "hace 3 horas", "hace 2 semanas"; con menos de un minuto, "ahora"; con una fecha inválida, "". */
export function timeAgo(iso: string, now = Date.now()) {
    const time = timeOf(iso);
    if (Number.isNaN(time)) return "";
    const seconds = Math.round((time - now) / 1000);
    for (const [unit, size] of units) {
        if (Math.abs(seconds) >= size) return relativeFormat.format(Math.trunc(seconds / size), unit);
    }
    return "ahora";
}

/**
 * Comentarios oficiales (roles distintos de ciudadano) fijados arriba, el más reciente primero;
 * el resto en orden de publicación. No modifica la lista recibida.
 * Se compara por instante y no por texto: "…05Z" y "…05.123Z" son el mismo segundo con distinta precisión.
 */
export function pinOfficialFirst<T extends { created_at: string }>(items: T[], isOfficial: (item: T) => boolean): T[] {
    return [...items].sort((a, b) => {
        const officialA = isOfficial(a), officialB = isOfficial(b);
        if (officialA !== officialB) return officialA ? -1 : 1;
        const order = (timeOf(a.created_at) || 0) - (timeOf(b.created_at) || 0);
        return officialA ? -order : order;
    });
}
