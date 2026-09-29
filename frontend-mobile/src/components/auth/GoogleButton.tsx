import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';
import { GoogleIcon } from '../icons/GoogleIcon';

type Props = {
  onPress: () => void;
};

/**
 * `onPress` dispara el flujo real de expo-auth-session cuando hay un Client
 * ID de Google configurado. Sigue sin conectarse a ningún backend — el
 * endpoint de auth ahí no existe todavía.
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
