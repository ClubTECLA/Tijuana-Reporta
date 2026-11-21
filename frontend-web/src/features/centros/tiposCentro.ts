import type { ApiTipoCentro } from "@/types/api-types";

// Color e icono de cada tipo de centro ("19. Refugio - ListaCompleta" y "21. Nuevo Refugio" del Figma). El backend
// solo guarda el nombre del tipo: se reconoce por nombre y no por id, que cambia entre entornos (igual que la app
// móvil). Los colores son tokens de index.css (--color-centro-*) y los iconos, los SVG del Figma en public/centros.
// shortcut: un tipo nuevo necesita su token y su SVG aquí; cuando tipos_centro traiga color e icono, leerlos del API
// y dejar esto como respaldo.
interface TipoStyle {
    color: string
    icon: string | null
}

const TIPO_STYLES: Record<string, TipoStyle> = {
    refugios: { color: "var(--color-centro-refugios)", icon: "/centros/refugios.svg" },
    rescate: { color: "var(--color-centro-rescate)", icon: "/centros/rescate.svg" },
    salud: { color: "var(--color-centro-salud)", icon: "/centros/salud.svg" },
    seguridad: { color: "var(--color-centro-seguridad)", icon: "/centros/seguridad.svg" },
};

// Un tipo creado después desde el API aún no tiene diseño: gris y sin icono propio.
const DEFAULT_STYLE: TipoStyle = { color: "var(--color-centro-otro)", icon: null };

// "Protección Civil" → "proteccion civil": sin mayúsculas, acentos ni espacios de más.
const normalizar = (texto: string) => texto.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

export function tipoStyle(tipo?: ApiTipoCentro): TipoStyle {
    return (tipo && TIPO_STYLES[normalizar(tipo.nombre)]) || DEFAULT_STYLE;
}
