import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';

const PUNTO = 18;

/**
 * Punto azul de la posición del usuario. Lo fija el mapa como marcador en la última posición
 * conocida; no usa la capa nativa de ubicación, que se ve demasiado pequeña.
 */
export function PuntoUsuario() {
  return <View style={styles.punto} />;
}

const styles = StyleSheet.create({
  punto: {
    width: PUNTO,
    height: PUNTO,
    borderRadius: PUNTO / 2,
    backgroundColor: colors.brand,
    borderWidth: 3,
    borderColor: colors.white,
  },
});
