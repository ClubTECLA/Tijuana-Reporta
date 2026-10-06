import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';

const PUNTO = 18;
const HALO = 44;

/**
 * Punto azul con halo de la posición del usuario (Figma 10). El mapa lo usa cuando la
 * posición es simulada; con GPS real lo dibuja `MapLibreGL.UserLocation`.
 */
export function PuntoUsuario() {
  return (
    <View style={styles.halo}>
      <View style={styles.punto} />
    </View>
  );
}

const styles = StyleSheet.create({
  halo: {
    width: HALO,
    height: HALO,
    borderRadius: HALO / 2,
    backgroundColor: 'rgba(38,119,230,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  punto: {
    width: PUNTO,
    height: PUNTO,
    borderRadius: PUNTO / 2,
    backgroundColor: colors.brand,
    borderWidth: 3,
    borderColor: colors.white,
  },
});
