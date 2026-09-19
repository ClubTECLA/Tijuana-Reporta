import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  /** Alto del bloque del mapa. Debe ocupar flujo normal, no ir "fijo" detrás
   * del contenido — si no, al hacer scroll el formulario queda montado sobre
   * el mapa en vez de sobre la zona ya desvanecida a blanco. */
  height: number;
  /**
   * En qué fracción de `height` (0-1) el degradado ya es blanco sólido. Las
   * pantallas de formulario (más chicas, mapa arriba nomás) usan un valor
   * más alto por defecto; Bienvenida (mapa a pantalla completa) necesita que
   * ya esté blanco bastante antes de donde cae el título, si no el texto
   * "Tijuana Reporta" queda compitiendo visualmente con el mapa.
   */
  fadeToWhiteAt?: number;
};

/**
 * Fondo decorativo compartido por todas las pantallas de auth: el mapa con
 * pines de incidentes tal como se exportó de Figma, sin nada superpuesto ni
 * animación. Va como el primer elemento dentro del ScrollView (no absoluto)
 * para que se desplace junto con el resto del contenido.
 */
export function AuthMapBackground({ height, fadeToWhiteAt = 0.85 }: Props) {
  return (
    <View style={[styles.container, { height }]} pointerEvents="none">
      <Image
        source={require('../../../assets/auth/map-background.png')}
        style={styles.map}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(153,153,153,0)', 'rgba(238,241,244,0.4)', '#ffffff']}
        locations={[0, fadeToWhiteAt * 0.65, fadeToWhiteAt]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#eef1f4',
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
