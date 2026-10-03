import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LocationPinIcon } from '@/components/icons/LocationPinIcon';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import type { LugarResultado as LugarResultadoType } from '@/features/lugares/types';
import { EtiquetaActivos } from './EtiquetaActivos';

interface LugarResultadoProps {
  lugar: LugarResultadoType;
  onPress: () => void;
  conBorde?: boolean;
}

export function LugarResultado({ lugar, onPress, conBorde = true }: LugarResultadoProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.fila, conBorde && styles.conBorde]}
    >
      <View style={styles.icono}>
        <LocationPinIcon size={20} color={colors.textSecondary} />
      </View>
      <View style={styles.textos}>
        {/* 2 líneas: varios resultados reales pueden compartir el mismo
            prefijo (p. ej. distintos fraccionamientos de una misma colonia)
            y con 1 sola línea se ven idénticos aunque no lo sean. */}
        <Text style={styles.nombre} numberOfLines={2}>
          {lugar.nombre}
        </Text>
        <Text style={styles.subtitulo} numberOfLines={1}>
          {lugar.subtitulo}
        </Text>
      </View>
      <EtiquetaActivos activos={lugar.activos} tono={lugar.tono} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  conBorde: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  icono: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bgCanvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  subtitulo: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
});
