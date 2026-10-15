import { Pressable, StyleSheet } from 'react-native';
import { CapasIcon } from '@/components/icons/CapasIcon';
import { colors } from '@/theme/colors';

interface CapasFabProps {
  onPress: () => void;
}

/** Botón "Capas y filtros" (Figma 10.1 · boton-capas): círculo blanco igual al de ubicación. */
export function CapasFab({ onPress }: CapasFabProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Capas y filtros"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <CapasIcon color={colors.iconoOscuro} />
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
