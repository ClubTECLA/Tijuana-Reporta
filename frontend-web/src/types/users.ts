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

/** Roles con más peso que el ciudadano: sus comentarios son oficiales y se fijan arriba. */
export function isOfficialRole(rol?: string | null) {
    return !!rol && rol !== "ciudadano";
}

/** "Bruce Cervantes" → "BC"; con una sola palabra, sus dos primeras letras. */
export function initials(username: string) {
    const [first = "", second = ""] = username.trim().split(/\s+/);
    return (second ? first[0] + second[0] : first.slice(0, 2)).toUpperCase();
}
