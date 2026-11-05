import { useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraIcon } from '@/components/icons/CameraIcon';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import type { OrigenFoto } from '../foto/seleccionar';
import { MenuFotoModal } from './MenuFotoModal';

interface FotoReporteProps {
  /** Foto ya reducida y lista para subir; `null` si todavía no se eligió. */
  fotoUri: string | null;
  /** Se está abriendo el selector o reduciendo la foto. */
  preparando: boolean;
  /** Por qué no se pudo elegir o reducir la foto. */
  error: string | null;
  /** El usuario negó el permiso de la cámara. */
  sinPermisoCamara: boolean;
  /** Mientras se envía el reporte no se puede cambiar la foto. */
  deshabilitado?: boolean;
  onElegir: (origen: OrigenFoto) => void;
  onQuitar: () => void;
}

/** Foto opcional del reporte: botón punteado para tomarla o elegirla; con foto, vista previa con
 * "Cambiar" y "Quitar". La foto se sube después de crear el reporte, no aquí. */
export function FotoReporte({
  fotoUri,
  preparando,
  error,
  sinPermisoCamara,
  deshabilitado = false,
  onElegir,
  onQuitar,
}: FotoReporteProps) {
  const bloqueado = deshabilitado || preparando;
  const [menuAbierto, setMenuAbierto] = useState(false);

  const abrirMenu = () => setMenuAbierto(true);
  // Cierra la hoja antes de abrir la cámara o la galería: si no, el selector nativo nace sobre el modal.
  const elegirDesdeMenu = (origen: OrigenFoto) => {
    setMenuAbierto(false);
    onElegir(origen);
  };

  return (
    <View>
      {fotoUri ? (
        <View>
          <Image source={{ uri: fotoUri }} style={styles.vistaPrevia} resizeMode="cover" accessibilityLabel="Foto del reporte" />
          <View style={styles.acciones}>
            <Pressable
              onPress={abrirMenu}
              disabled={bloqueado}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cambiar la foto"
            >
              <Text style={[styles.accion, bloqueado && styles.accionDeshabilitada]}>Cambiar</Text>
            </Pressable>
            <Pressable
              onPress={onQuitar}
              disabled={bloqueado}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Quitar la foto"
            >
              <Text style={[styles.accion, styles.accionQuitar, bloqueado && styles.accionDeshabilitada]}>Quitar</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={[styles.boton, bloqueado && styles.botonDeshabilitado]}
          onPress={abrirMenu}
          disabled={bloqueado}
          accessibilityRole="button"
          accessibilityLabel="Tomar o subir una foto"
          accessibilityState={{ disabled: bloqueado, busy: preparando }}
        >
          {preparando ? <ActivityIndicator color={colors.black} /> : <CameraIcon />}
        </Pressable>
      )}

      {sinPermisoCamara && (
        <View style={styles.aviso}>
          <Text style={styles.avisoTexto}>Para tomar la foto, permite el acceso a la cámara en Ajustes.</Text>
          <Pressable onPress={() => Linking.openSettings()} hitSlop={8} accessibilityRole="button">
            <Text style={styles.accion}>Abrir Ajustes</Text>
          </Pressable>
        </View>
      )}
      {!!error && (
        <Text style={styles.avisoTexto} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
      <MenuFotoModal
        visible={menuAbierto}
        onElegir={elegirDesdeMenu}
        onCancelar={() => setMenuAbierto(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  boton: {
    marginTop: 9.7,
    height: 81,
    borderRadius: 13.16,
    borderWidth: 1.645,
    borderStyle: 'dashed',
    borderColor: colors.black,
    backgroundColor: colors.photoBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  vistaPrevia: {
    marginTop: 9.7,
    height: 160,
    borderRadius: 13.16,
    backgroundColor: colors.photoBackground,
  },
  acciones: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
  },
  accion: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.brandText,
  },
  accionQuitar: {
    color: colors.errorLabel,
  },
  accionDeshabilitada: {
    opacity: 0.5,
  },
  aviso: {
    marginTop: 8,
    gap: 4,
  },
  avisoTexto: {
    marginTop: 8,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.errorLabel,
  },
});
