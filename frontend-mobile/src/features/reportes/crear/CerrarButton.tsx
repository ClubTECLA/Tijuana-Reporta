import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme/colors';

interface CerrarButtonProps {
  onPress: () => void;
  /** `rojo` es el botón de la lista expandida de categorías. */
  variant?: 'claro' | 'rojo';
}

export function CerrarButton({ onPress, variant = 'claro' }: CerrarButtonProps) {
  const rojo = variant === 'rojo';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Cerrar"
      hitSlop={8}
      style={[styles.button, rojo ? styles.rojo : styles.claro]}
    >
      <Svg width={50} height={50} viewBox="0 0 50 50" fill="none" style={StyleSheet.absoluteFill}>
        <Path
          d="M18.75 18.75L31.25 31.25M31.25 18.75L18.75 31.25"
          stroke={rojo ? colors.white : colors.slate}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  claro: {
    backgroundColor: colors.white,
    borderColor: colors.borderSubtle,
  },
  rojo: {
    backgroundColor: '#ed2b2b',
    borderColor: '#c40a0d',
  },
});
