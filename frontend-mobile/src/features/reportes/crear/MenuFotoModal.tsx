import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraIcon } from '@/components/icons/CameraIcon';
import { GaleriaIcon } from '@/components/icons/GaleriaIcon';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import type { OrigenFoto } from '../foto/seleccionar';

interface MenuFotoModalProps {
  visible: boolean;
  onElegir: (origen: OrigenFoto) => void;
  onCancelar: () => void;
}

/**
 * Hoja "Agregar foto" con el lenguaje de las demás hojas de la app: cámara a la izquierda, galería a la
 * derecha, ambas como botones circulares de solo icono, y Cancelar en rojo al pie.
 */
export function MenuFotoModal({ visible, onElegir, onCancelar }: MenuFotoModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onCancelar}>
      <View style={styles.fondo}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancelar} accessibilityLabel="Cerrar menú de foto" />
        <View style={[styles.hoja, { paddingBottom: Math.max(insets.bottom, 0) + 24 }]}>
          <Text style={styles.titulo}>Agregar foto</Text>
          <Text style={styles.subtitulo}>Toma una foto del incidente o elige una de tu galería.</Text>

          <View style={styles.opciones}>
            <Pressable
              onPress={() => onElegir('camara')}
              accessibilityRole="button"
              accessibilityLabel="Tomar foto"
              style={({ pressed }) => [styles.circulo, pressed && styles.presionado]}
            >
              <CameraIcon width={34} color={colors.white} />
            </Pressable>
            <Pressable
              onPress={() => onElegir('galeria')}
              accessibilityRole="button"
              accessibilityLabel="Elegir de la galería"
              style={({ pressed }) => [styles.circulo, pressed && styles.presionado]}
            >
              <GaleriaIcon size={36} color={colors.white} />
            </Pressable>
          </View>

          <Pressable
            onPress={onCancelar}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cancelar, pressed && styles.presionado]}
          >
            <Text style={styles.cancelarTexto}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.scrim,
  },
  hoja: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 8,
    elevation: 16,
  },
  titulo: {
    fontFamily: fontFamily.bold,
    fontSize: 21,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitulo: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  opciones: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 36,
    marginTop: 22,
    marginBottom: 26,
  },
  circulo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  presionado: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  cancelar: {
    height: 60,
    borderRadius: 999,
    backgroundColor: colors.reportRed,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.reportRed,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cancelarTexto: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.white,
  },
});
