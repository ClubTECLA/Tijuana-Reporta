import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthMapBackground } from '../src/components/auth/AuthMapBackground';
import { BotonPildora } from '../src/components/BotonPildora';
import { LocationPinIcon } from '../src/components/icons/LocationPinIcon';
import { usePermisosVistos } from '../src/features/bienvenida/permisosVistos';
import { colors } from '../src/theme/colors';
import { fontFamily } from '../src/theme/typography';

export default function Bienvenida() {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const permisosVistos = usePermisosVistos();

  // La primera vez se pasa antes por "Activa tu ubicación" y "Recibe alertas cercanas".
  if (permisosVistos === null) return <View style={styles.root} />;
  if (!permisosVistos) return <Redirect href="/permisos/ubicacion" />;

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
              <LocationPinIcon size={42.778} />
            </View>
            <Text style={styles.brandTitle}>CimAlert</Text>
          </View>

          <Text style={styles.tagline}>Alerta ciudadana · temporada El Niño</Text>

          <Text style={styles.description}>
            Reporta incidentes ocasionados en la ciudad. La comunidad confirma y todos se
            enteran antes de salir.
          </Text>

          <View style={styles.actions}>
            <BotonPildora etiqueta="Crear cuenta" onPress={() => router.push('/(auth)/auth?tab=signup')} />
            <BotonPildora
              etiqueta="Ya tengo cuenta"
              variante="secundario"
              style={styles.loginButton}
              onPress={() => router.push('/(auth)/auth?tab=login')}
            />
            {/* El mapa como invitado no está en el alcance de este flujo todavía. */}
            <BotonPildora
              etiqueta="Ver el mapa como invitado"
              variante="texto"
              style={styles.guestButton}
              onPress={() => router.push('/(main)')}
            />
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
  // Medidas del Figma 3 (Bienvenida).
  content: {
    paddingHorizontal: 28,
    paddingBottom: 60,
    gap: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginLeft: -9,
  },
  brandBadge: {
    width: 77,
    height: 77,
    borderRadius: 38.5,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 36.822,
    lineHeight: 36.822,
    letterSpacing: -0.9206,
    color: colors.ink,
  },
  tagline: {
    marginTop: 9,
    fontFamily: fontFamily.regular,
    fontSize: 17.359,
    lineHeight: 26.039,
    color: colors.slate,
  },
  description: {
    marginTop: 10,
    fontFamily: fontFamily.regular,
    fontSize: 15.285,
    lineHeight: 21.836,
    color: colors.black,
  },
  actions: {
    marginTop: 60,
  },
  loginButton: {
    marginTop: 29,
  },
  guestButton: {
    marginTop: -4,
  },
});
