/** Validación mínima antes de mandar al backend (que valida el formato completo): algo@algo.dominio, sin espacios. */
export const esCorreoValido = (correo: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());

// El backend exige contraseñas de 8 a 72 bytes (límite de bcrypt).
export const PASSWORD_MIN = 8;
