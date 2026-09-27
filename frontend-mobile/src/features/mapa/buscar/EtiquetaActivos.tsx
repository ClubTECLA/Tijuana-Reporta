import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import type { TonoLugar } from '@/features/lugares/types';

interface EtiquetaActivosProps {
  activos: number;
  tono: TonoLugar;
}

const TONOS: Record<TonoLugar, { bg: string; text: string; dot?: string }> = {
  peligro: { bg: colors.etiquetaPeligroBg, text: colors.etiquetaPeligroText, dot: colors.etiquetaPeligroText },
  advertencia: {
    bg: colors.etiquetaAdvertenciaBg,
    text: colors.etiquetaAdvertenciaText,
    dot: colors.etiquetaAdvertenciaText,
  },
  neutro: { bg: colors.bgCanvas, text: colors.textSecondary },
};

export function EtiquetaActivos({ activos, tono }: EtiquetaActivosProps) {
  const cfg = TONOS[tono];
  const texto = activos === 0 ? 'Sin incidentes' : `${activos} activo${activos === 1 ? '' : 's'}`;
  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
      {cfg.dot && <View style={[styles.dot, { backgroundColor: cfg.dot }]} />}
      <Text style={[styles.texto, { color: cfg.text }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  texto: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
  },
});
