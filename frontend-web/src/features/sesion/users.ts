// Presentación de usuarios y roles, compartida por el widget de perfil y los comentarios.

const rolLabels: Record<string, string> = {
    admin: "Administrador",
    moderador: "Moderador",
    analista: "Analista",
    proteccion_civil: "Protección Civil",
    rescatista: "Rescatista",
    ciudadano: "Ciudadano",
};

/** Nombre visible del rol ("proteccion_civil" → "Protección Civil"); si no está registrado, el del backend. */
export function rolLabel(rol: string) {
    return rolLabels[rol] ?? rol;
}

/**
 * Roles con más peso que el ciudadano: publican reportes oficiales, cambian estados y sus comentarios se fijan arriba.
 * Es a propósito la misma regla que el backend (rol != domain.RolCiudadano en el servicio de reportes): un rol
 * nuevo cuenta como oficial en los dos lados. Si el backend pasa a una lista explícita, cambiarla aquí igual.
 */
export function isOfficialRole(rol?: string | null) {
    return !!rol && rol !== "ciudadano";
}

/** Puede publicar incidentes desde el web: rol oficial, salvo el analista (vista de solo lectura en el Figma). */
export function canPublishIncidents(rol?: string | null) {
    return isOfficialRole(rol) && rol !== "analista";
}

/** "Bruce Cervantes" → "BC"; con una sola palabra, sus dos primeras letras. */
export function initials(username: string) {
    const [first = "", second = ""] = username.trim().split(/\s+/);
    return (second ? first[0] + second[0] : first.slice(0, 2)).toUpperCase();
}
