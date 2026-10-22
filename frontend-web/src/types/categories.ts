import type { IconType } from "react-icons";
import { GiHole } from "react-icons/gi";
import { LuGrid3X3, LuTreeDeciduous, LuTriangleAlert, LuZap } from "react-icons/lu";
import { MdFlood, MdLandslide, MdLocalFireDepartment } from "react-icons/md";

// Icono y nombre visible de cada categoría del backend (tabla incidentes, campo nombre).
// Lo comparten la tarjeta de categoría ("Nuevo incidente") y la fila de incidente (listas).
const categoryIcons: Record<string, IconType> = {
    inundacion: MdFlood,
    deslave: MdLandslide,
    arbol: LuTreeDeciduous,
    socavon: GiHole,
    drenaje: LuGrid3X3,
    luz: LuZap,
    incendio: MdLocalFireDepartment,
};

const categoryLabels: Record<string, string> = {
    inundacion: "Inundación",
    deslave: "Deslave",
    arbol: "Árbol caído",
    socavon: "Socavón",
    drenaje: "Drenaje",
    luz: "Falta de Luz",
    incendio: "Incendio",
};

/** Icono de la categoría; las que no estén registradas usan una alerta genérica. */
export function categoryIcon(nombre: string): IconType {
    return categoryIcons[nombre] ?? LuTriangleAlert;
}

/** Nombre visible de la categoría; si no está registrado, el nombre del backend con mayúscula inicial. */
export function categoryLabel(nombre: string): string {
    return categoryLabels[nombre] ?? nombre.charAt(0).toUpperCase() + nombre.slice(1);
}
