import { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BotonPildora } from '@/components/BotonPildora';
import { AlertTriangleIcon } from '@/components/icons/AlertTriangleIcon';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

interface AvisoEmergenciaProps {
  visible: boolean;
  onCerrar: () => void;
}

// Popup que aparece después de crear el reporte: solo sugiere marcar al 911 si el incidente es muy
// peligroso, porque la app no sustituye a los servicios de emergencia. Sin diseño en Figma todavía:
// sigue el estilo de las hojas y botones existentes.
export function AvisoEmergencia({ visible, onCerrar }: AvisoEmergenciaProps) {
  const [errorLlamada, setErrorLlamada] = useState(false);

  useEffect(() => {
    if (visible) setErrorLlamada(false);
  }, [visible]);

  // El aviso solo se cierra si el marcador abrió; si no (p. ej. tablet sin telefonía), se queda
  // abierto con instrucciones para marcar a mano.
  const llamar911 = async () => {
    try {
      await Linking.openURL('tel:911');
      onCerrar();
    } catch {
      setErrorLlamada(true);
    }
  };

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
            Tu reporte ya fue enviado. Si hay personas en riesgo o necesitas ayuda inmediata, te sugerimos
            marcar al 911: la app no sustituye una llamada de emergencia.
          </Text>
          {errorLlamada && (
            <Text style={styles.error} accessibilityLiveRegion="assertive">
              No se pudo abrir el marcador. Marca al 911 desde la app de teléfono.
            </Text>
          )}
          <View style={styles.acciones}>
            <BotonPildora etiqueta="Llamar al 911" onPress={() => void llamar911()} style={styles.botonLlamar} />
            <BotonPildora etiqueta="Entendido" variante="secundario" onPress={onCerrar} />
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
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 12,
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
  error: {
    marginTop: 12,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.errorLabel,
    textAlign: 'center',
  },
  acciones: {
    marginTop: 24,
    alignSelf: 'stretch',
    gap: 12,
  },
  botonLlamar: {
    backgroundColor: colors.reportRed,
    shadowColor: colors.reportRed,
  },
});
