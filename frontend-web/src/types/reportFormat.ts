// Formatos de presentación de un reporte, compartidos por la lista y el detalle.

/** Folio corto derivado del id, con la misma fórmula que codigoReporte() de mobile. Solo presentación. */
export function folio(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 9000;
    return `INC-${hash + 1000}`;
}

// Las fechas se muestran en la hora de Tijuana aunque el navegador tenga otra zona horaria.
const TIME_ZONE = "America/Tijuana";
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
