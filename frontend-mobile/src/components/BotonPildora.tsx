import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

type Variante = 'primario' | 'secundario' | 'texto';

interface BotonPildoraProps {
  etiqueta: string;
  onPress: () => void;
  variante?: Variante;
  /** Ícono a la izquierda de la etiqueta (20 px). */
  icono?: ReactNode;
  cargando?: boolean;
  style?: ViewStyle;
}

// Botón de 60 px en píldora del Figma (`Button/…`): primario azul con sombra, secundario blanco
// con borde, o solo texto (p. ej. "Ver el mapa como invitado").
export function BotonPildora({ etiqueta, onPress, variante = 'primario', icono, cargando = false, style }: BotonPildoraProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={cargando}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ busy: cargando }}
      style={({ pressed }) => [styles.boton, styles[variante], pressed && styles.presionado, style]}
    >
      {cargando ? (
        <ActivityIndicator color={variante === 'primario' ? colors.white : colors.brand} />
      ) : (
        <>
          {icono}
          <Text style={[styles.etiqueta, styles[`etiqueta_${variante}`]]}>{etiqueta}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    height: 60,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  primario: {
    backgroundColor: colors.brand,
    // Efecto "Azul" del Figma: sombra azul corta bajo el botón.
    elevation: 4,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 1.55,
  },
  secundario: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  texto: {
    backgroundColor: 'transparent',
  },
  presionado: {
    opacity: 0.85,
  },
  etiqueta: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
  },
  etiqueta_primario: {
    color: colors.white,
  },
  etiqueta_secundario: {
    color: colors.textPrimary,
  },
  etiqueta_texto: {
    color: colors.brandText,
  },
});
