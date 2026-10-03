import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { AlertTriangleIcon } from '@/components/icons/AlertTriangleIcon';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

// Píldora "Reportar" del mapa fijo (Figma 10). En movimiento se contrae a un círculo
// de la misma altura, para que el botón no cambie de tamaño al arrastrar.
const ANCHO_EXPANDIDO = 228;
const ALTO = 60;
const GAP = 10;
// Ancho del texto "Reportar" (bold 18) para que el contenido siga centrado mientras se anima.
const ANCHO_TEXTO = 84;

interface ReportarFabProps {
  onPress: () => void;
  /** Mapa quieto: el botón se ensancha y muestra "Reportar". En movimiento queda solo el círculo. */
  expandido?: boolean;
}

export function ReportarFab({ onPress, expandido = false }: ReportarFabProps) {
  const progreso = useRef(new Animated.Value(expandido ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progreso, { toValue: expandido ? 1 : 0, duration: 220, useNativeDriver: false }).start();
  }, [expandido, progreso]);

  const ancho = progreso.interpolate({ inputRange: [0, 1], outputRange: [ALTO, ANCHO_EXPANDIDO] });
  const anchoTexto = progreso.interpolate({ inputRange: [0, 1], outputRange: [0, ANCHO_TEXTO + GAP] });
  const opacidadTexto = progreso.interpolate({ inputRange: [0.4, 1], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Reportar incidente"
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Animated.View style={[styles.boton, { width: ancho }]}>
        <AlertTriangleIcon size={24} />
        <Animated.View style={[styles.textoWrap, { width: anchoTexto, opacity: opacidadTexto }]}>
          <Text style={styles.texto} numberOfLines={1}>
            Reportar
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  boton: {
    height: ALTO,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.reportRed,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.reportRed,
  },
  // El ancho animado incluye la separación con el icono; ésta va dentro (marginLeft del texto)
  // para que con ancho 0 no ocupe espacio y el icono quede centrado en el círculo.
  textoWrap: {
    overflow: 'hidden',
  },
  texto: {
    marginLeft: GAP,
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.white,
  },
});
