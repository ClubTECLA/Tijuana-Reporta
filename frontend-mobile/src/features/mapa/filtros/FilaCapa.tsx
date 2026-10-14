import type { ReactNode } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

interface FilaCapaProps {
  icono: ReactNode;
  titulo: string;
  descripcion: string;
  activa: boolean;
  onCambio: (activa: boolean) => void;
}

// Fila de la tarjeta "Capas" (Figma `Capa/…`): icono en cuadro azul claro, título, descripción e
// interruptor nativo con los colores del tema.
export function FilaCapa({ icono, titulo, descripcion, activa, onCambio }: FilaCapaProps) {
  return (
    <View style={styles.fila}>
      <View style={styles.icono}>{icono}</View>
      <View style={styles.textos}>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.descripcion}>{descripcion}</Text>
      </View>
      <Switch
        value={activa}
        onValueChange={onCambio}
        accessibilityRole="switch"
        accessibilityLabel={titulo}
        accessibilityState={{ checked: activa }}
        trackColor={{ false: colors.surfaceHover, true: colors.brand }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
  },
  icono: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.infoSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  descripcion: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
});
