import type { IconType } from "react-icons";
import { GiHole } from "react-icons/gi";
import { LuGrid3X3, LuTreeDeciduous, LuTriangleAlert, LuZap } from "react-icons/lu";
import { MdFlood, MdLandslide, MdLocalFireDepartment } from "react-icons/md";

// Icono de cada categoría del backend (tabla incidentes, campo nombre). El texto visible ya no vive aquí:
// es incidente.etiqueta, el mismo que usa el backend para armar el título del reporte.
// Lo comparten la tarjeta de categoría, la fila de incidente, el pin del mapa y el detalle.
const categoryIcons: Record<string, IconType> = {
    inundacion: MdFlood,
    deslave: MdLandslide,
    arbol: LuTreeDeciduous,
    socavon: GiHole,
    drenaje: LuGrid3X3,
    luz: LuZap,
    incendio: MdLocalFireDepartment,
};

/** Icono de la categoría; las que no estén registradas usan una alerta genérica. */
export function categoryIcon(nombre: string): IconType {
    return categoryIcons[nombre] ?? LuTriangleAlert;
}
