import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertTriangleIcon } from '@/components/icons/AlertTriangleIcon';
import { InfoIcon } from '@/components/icons/InfoIcon';
import { WifiOffIcon } from '@/components/icons/WifiOffIcon';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

export type TipoAviso = 'cargando' | 'sin-conexion' | 'error' | 'info';

interface AvisoFlotanteProps {
  tipo: TipoAviso;
  mensaje: string;
  accion?: { etiqueta: string; onPress: () => void };
}

function Icono({ tipo }: { tipo: TipoAviso }) {
  if (tipo === 'cargando') return <ActivityIndicator size="small" color={colors.white} />;
  if (tipo === 'sin-conexion') return <WifiOffIcon size={16} color={colors.white} />;
  if (tipo === 'error') return <AlertTriangleIcon size={16} color={colors.white} />;
  return <InfoIcon size={16} color={colors.white} />;
}

// Píldora oscura sobre el mapa para avisar del estado de los datos sin taparlo (cargando, sin
// conexión, error al cargar o sin reportes). Diseño provisional, como `EstadoVista`.
export function AvisoFlotante({ tipo, mensaje, accion }: AvisoFlotanteProps) {
  return (
    <View style={styles.aviso} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Icono tipo={tipo} />
      <Text style={styles.texto}>{mensaje}</Text>
      {accion && (
        <Pressable onPress={accion.onPress} accessibilityRole="button" hitSlop={10}>
          <Text style={styles.accion}>{accion.etiqueta}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 340,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.estadoAviso,
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  texto: {
    flexShrink: 1,
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.white,
  },
  accion: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.estadoAvisoAccion,
  },
});
