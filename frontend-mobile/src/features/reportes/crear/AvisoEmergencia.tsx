import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BotonPildora } from '@/components/BotonPildora';
import { AlertTriangleIcon } from '@/components/icons/AlertTriangleIcon';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

interface AvisoEmergenciaProps {
  visible: boolean;
  onCerrar: () => void;
}

// Popup que aparece después de crear el reporte: solo avisa que, si el incidente es muy peligroso,
// hay que marcar al 911, porque la app no sustituye a los servicios de emergencia. Sin diseño en
// Figma todavía: sigue el estilo de las hojas y botones existentes.
export function AvisoEmergencia({ visible, onCerrar }: AvisoEmergenciaProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onCerrar} accessibilityLabel="Cerrar aviso" />
        <View style={styles.tarjeta} accessibilityViewIsModal>
          <View style={styles.icono}>
            <AlertTriangleIcon size={30} color={colors.reportRed} />
          </View>
          <Text style={styles.titulo} accessibilityRole="header">
            ¿El incidente es muy peligroso?
          </Text>
          <Text style={styles.texto}>
            Tu reporte ya fue enviado. Si hay personas en riesgo o necesitas ayuda inmediata, marca al 911:
            la app no sustituye una llamada de emergencia.
          </Text>
          <View style={styles.acciones}>
            <BotonPildora etiqueta="Entendido" onPress={onCerrar} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  tarjeta: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    paddingTop: 28,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    elevation: 16,
  },
  icono: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.etiquetaPeligroBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    marginTop: 16,
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  texto: {
    marginTop: 8,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  acciones: {
    marginTop: 24,
    alignSelf: 'stretch',
  },
});
