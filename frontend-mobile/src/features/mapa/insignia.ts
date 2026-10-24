const MAX_VISIBLE = 99;

/** Texto del contador de confirmaciones del pin: el número tal cual, '99+' desde 100 y 0 si el valor no es válido. */
export function textoConfirmaciones(confirmaciones: number): string {
  const n = Number.isFinite(confirmaciones) ? Math.max(0, Math.floor(confirmaciones)) : 0;
  return n > MAX_VISIBLE ? `${MAX_VISIBLE}+` : String(n);
}
