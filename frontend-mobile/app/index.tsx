import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthMapBackground } from '../src/components/auth/AuthMapBackground';
import { PrimaryButton } from '../src/components/auth/PrimaryButton';
import { LocationPinIcon } from '../src/components/icons/LocationPinIcon';
import { colors } from '../src/theme/colors';
import { fontFamily } from '../src/theme/typography';

export default function Bienvenida() {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();

  return (
    <View style={styles.root}>
      {/* Esta pantalla no hace scroll, así que el mapa puede ir fijo detrás
          de todo el contenido sin el problema que sí afecta a las pantallas
          con formulario (ver AuthScreenShell). */}
      <View style={styles.mapWrapper} pointerEvents="none">
        <AuthMapBackground height={windowHeight} fadeToWhiteAt={0.48} />
      </View>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.spacer} />

        <View style={styles.content}>
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <LocationPinIcon size={24} />
            </View>
            <Text style={styles.brandTitle}>Tijuana Reporta</Text>
          </View>

          <Text style={styles.tagline}>Alerta ciudadana · temporada El Niño</Text>

          <Text style={styles.description}>
            Reporta incidentes ocasionados en la ciudad. La comunidad confirma y todos se
            enteran antes de salir.
          </Text>

          <View style={styles.actions}>
            <PrimaryButton
              label="Crear cuenta"
              showArrow={false}
              style={styles.createAccountButton}
              onPress={() => router.push('/(auth)/auth?tab=signup')}
            />
            <Pressable style={styles.loginOutline} onPress={() => router.push('/(auth)/auth?tab=login')}>
              <Text style={styles.loginOutlineLabel}>Ya tengo cuenta</Text>
            </Pressable>
            {/* El mapa como invitado no está en el alcance de este flujo todavía. */}
            <Pressable onPress={() => router.push('/(main)')}>
              <Text style={styles.guestLink}>Ver el mapa como invitado</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  safeArea: {
    flex: 1,
  },
  mapWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  spacer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  brandBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 27,
    color: colors.headingDark,
  },
  tagline: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.black,
  },
  actions: {
    marginTop: 12,
    gap: 14,
  },
  createAccountButton: {
    backgroundColor: colors.primary,
  },
  loginOutline: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginOutlineLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.black,
  },
  guestLink: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.link,
    textAlign: 'center',
    marginTop: 4,
  },
});
