import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertTriangleIcon } from '@/components/icons/AlertTriangleIcon';
import { InfoIcon } from '@/components/icons/InfoIcon';
import { WifiOffIcon } from '@/components/icons/WifiOffIcon';
import type { EstadoDatos } from '@/lib/estados';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

type Estado = Exclude<EstadoDatos, 'listo'>;

interface EstadoVistaProps {
  estado: Estado;
  titulo?: string;
  mensaje?: string;
  /** Muestra el botón "Reintentar" (en error y sin conexión). */
  onReintentar?: () => void;
  /** Versión en una fila, para secciones chicas como el hilo de comentarios. */
  compacto?: boolean;
}

const TEXTOS: Record<Estado, { titulo: string; mensaje: string }> = {
  cargando: { titulo: '', mensaje: 'Cargando…' },
  'sin-conexion': {
    titulo: 'Sin conexión',
    mensaje: 'Revisa tu internet. Se cargará solo cuando vuelvas a estar en línea.',
  },
  error: { titulo: 'Algo salió mal', mensaje: 'No pudimos cargar la información.' },
  vacio: { titulo: 'Nada por aquí', mensaje: '' },
};

function Icono({ estado, size }: { estado: Estado; size: number }) {
  if (estado === 'cargando') return <ActivityIndicator color={colors.brand} />;
  if (estado === 'sin-conexion') return <WifiOffIcon size={size} color={colors.estadoIcono} />;
  if (estado === 'error') return <AlertTriangleIcon size={size} color={colors.estadoError} />;
  return <InfoIcon size={size} color={colors.estadoIcono} />;
}

// Estado de una lista o sección sin datos que mostrar: cargando, vacía, con error o sin conexión.
// El diseño es provisional (no hay Figma todavía): todos los estados pasan por aquí para
// cambiarlo en un solo lugar.
export function EstadoVista({ estado, titulo, mensaje, onReintentar, compacto = false }: EstadoVistaProps) {
  const textos = TEXTOS[estado];
  const tituloFinal = titulo ?? textos.titulo;
  const mensajeFinal = mensaje ?? textos.mensaje;
  const reintentar = onReintentar && (estado === 'error' || estado === 'sin-conexion') && (
    <Pressable onPress={onReintentar} accessibilityRole="button" hitSlop={8} style={compacto ? undefined : styles.boton}>
      <Text style={compacto ? styles.enlace : styles.botonTexto}>Reintentar</Text>
    </Pressable>
  );

  if (compacto) {
    return (
      <View style={styles.compacto} accessibilityLiveRegion="polite">
        <Icono estado={estado} size={18} />
        <Text style={styles.compactoTexto}>{mensajeFinal || tituloFinal}</Text>
        {reintentar}
      </View>
    );
  }

  return (
    <View style={styles.contenedor} accessibilityLiveRegion="polite">
      <View style={[styles.icono, estado === 'error' && styles.iconoError]}>
        <Icono estado={estado} size={26} />
      </View>
      {!!tituloFinal && <Text style={styles.titulo}>{tituloFinal}</Text>}
      {!!mensajeFinal && <Text style={styles.mensaje}>{mensajeFinal}</Text>}
      {reintentar}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
  },
  icono: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.estadoIconoFondo,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconoError: {
    backgroundColor: colors.estadoErrorFondo,
  },
  titulo: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: colors.ink,
    textAlign: 'center',
  },
  mensaje: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.slate,
    textAlign: 'center',
  },
  boton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.brand,
  },
  botonTexto: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.white,
  },
  compacto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  compactoTexto: {
    flexShrink: 1,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.slate,
  },
  enlace: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.brand,
  },
});
