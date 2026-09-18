import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';
import { GoogleIcon } from '../icons/GoogleIcon';

type Props = {
  onPress: () => void;
};

/**
 * Solo UI por ahora: no hay flujo de OAuth conectado todavía (pendiente de
 * Client ID de Google Cloud y de que el backend tenga el endpoint de auth).
 */
export function GoogleButton({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <GoogleIcon />
      <Text style={styles.label}>Continuar con Google</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    width: '100%',
    borderRadius: 28,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.textBody,
  },
});
