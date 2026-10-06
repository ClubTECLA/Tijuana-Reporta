import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { NavegacionIcon } from '@/components/icons/NavegacionIcon';
import { colors } from '@/theme/colors';

interface UbicacionFabProps {
  onPress: () => void;
  /** Mientras se obtiene la posición del GPS. */
  cargando?: boolean;
}

/** Botón "ir a mi ubicación" (Figma 10 · ubicacion-actual): círculo blanco de 49 px. */
export function UbicacionFab({ onPress, cargando = false }: UbicacionFabProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={cargando}
      accessibilityRole="button"
      accessibilityLabel="Ir a mi ubicación"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {cargando ? <ActivityIndicator size="small" color={colors.brand} /> : <NavegacionIcon />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 49,
    height: 49,
    borderRadius: 25,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 2.8,
    shadowOffset: { width: 0, height: 0 },
  },
  pressed: {
    opacity: 0.85,
  },
});
