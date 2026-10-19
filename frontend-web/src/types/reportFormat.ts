// Formatos de presentación de un reporte, compartidos por la lista y el detalle.

/** Folio corto derivado del id, con la misma fórmula que codigoReporte() de mobile. Solo presentación. */
export function folio(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 9000;
    return `INC-${hash + 1000}`;
}

const dateTimeFormat = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });
const relativeFormat = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

/** "17 oct 2026, 14:21" */
export function formatDateTime(iso: string) {
    return dateTimeFormat.format(new Date(iso));
}

const units: [Intl.RelativeTimeFormatUnit, number][] = [["day", 86_400], ["hour", 3_600], ["minute", 60]];

/** "hace 3 horas", "hace 5 minutos"; con menos de un minuto, "ahora". */
export function timeAgo(iso: string, now = Date.now()) {
    const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
    for (const [unit, size] of units) {
        if (Math.abs(seconds) >= size) return relativeFormat.format(Math.trunc(seconds / size), unit);
    }
    return "ahora";
}

/**
 * Comentarios oficiales (roles distintos de ciudadano) fijados arriba, el más reciente primero;
 * el resto en orden de publicación. No modifica la lista recibida.
 */
export function pinOfficialFirst<T extends { created_at: string }>(items: T[], isOfficial: (item: T) => boolean): T[] {
    return [...items].sort((a, b) => {
        const officialA = isOfficial(a), officialB = isOfficial(b);
        if (officialA !== officialB) return officialA ? -1 : 1;
        return officialA ? b.created_at.localeCompare(a.created_at) : a.created_at.localeCompare(b.created_at);
    });
}
