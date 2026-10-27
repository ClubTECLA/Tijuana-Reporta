// Lo que promete la pantalla "Recibe alertas cercanas": máximo 10 alertas al día, sin repetir la misma.
export const MAX_ALERTAS_DIA = 10;

/** Incidentes ya avisados en el día `dia` (fecha local, AAAA-M-D). */
export interface RegistroAlertas {
  dia: string;
  ids: string[];
}

/** Registro actualizado si hoy se puede avisar del incidente `id`, o `null` si ya se avisó o se llegó al tope. */
export function registrarAlerta(registro: RegistroAlertas | null, id: string, hoy: string): RegistroAlertas | null {
  const ids = registro?.dia === hoy ? registro.ids : [];
  if (ids.includes(id) || ids.length >= MAX_ALERTAS_DIA) return null;
  return { dia: hoy, ids: [...ids, id] };
}
