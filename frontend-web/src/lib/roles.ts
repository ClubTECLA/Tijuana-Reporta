const ROLE_LABELS: Record<string, string> = {
    admin: "Administrador",
    moderador: "Moderador",
    proteccion_civil: "Protección Civil",
    rescatista: "Rescatista",
    analista: "Analista",
    ciudadano: "Ciudadano",
};

/** Nombre legible de un rol. Si no está en el mapa, devuelve el nombre tal cual llegó del backend. */
export function roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
}