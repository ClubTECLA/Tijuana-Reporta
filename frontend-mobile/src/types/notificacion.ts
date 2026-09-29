export type TipoNotificacion = 'alerta' | 'info' | 'exito' | 'aviso' | 'comentario';

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  subtitulo: string;
  tiempo: string;   // "hace 3 min" | "ayer"
  grupo: 'Hoy' | 'Ayer';
  leida: boolean;
}
