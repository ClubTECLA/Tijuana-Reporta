import { EstadoReporte } from '../theme/perfilTokens';

export interface Reporte {
  id: string;
  codigo: string;        // "REP-8814"
  titulo: string;
  estado: EstadoReporte;
  meta: string;           // "se unió a INC-2471" | "hoy 14:33" | "28 ago"
  imagenColor?: string;   // color de relleno del placeholder de la miniatura
}
