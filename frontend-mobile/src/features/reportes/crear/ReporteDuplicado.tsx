import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Reporte } from '@/types/api';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { hace } from '@/lib/time';
import { CheckIcon } from '@/components/icons/CheckIcon';
import { InfoIcon } from '@/components/icons/InfoIcon';
import { UserIcon } from '@/components/icons/UserIcon';
import { CategoriaBadge } from './CategoriaBadge';
import { codigoReporte } from './codigo';

interface ReporteDuplicadoProps {
  reporte: Reporte;
  distanciaM: number;
  confirmando: boolean;
  /** Error al confirmar o al crear el reporte nuevo (p. ej. sin conexión). */
  error?: string | null;
  onConfirmar: () => void;
  onRechazar: () => void;
}

// Pantalla "¿Es el mismo incidente?" (Figma 19): aparece en vez de la hoja de
// reporte cuando ya existe uno parecido cerca. "Sí" suma una confirmación al
// reporte existente (useConfirmarDuplicado); "No" crea uno nuevo con los datos
// que el usuario ya llenó.
export function ReporteDuplicado({
  reporte,
  distanciaM,
  confirmando,
  error,
  onConfirmar,
  onRechazar,
}: ReporteDuplicadoProps) {
  const categoriaPrincipal = reporte.categorias[0];

  return (
    <View style={styles.sheet}>
      <View style={styles.cabecera}>
        <Text style={styles.titulo}>¿Es el mismo incidente?</Text>
        <Text style={styles.subtitulo}>
          Hay uno parecido a {Math.round(distanciaM)} m · {hace(reporte.created_at).toLowerCase()}
        </Text>
      </View>

      <View style={styles.contenido}>
        <View style={styles.tarjeta}>
          {reporte.image_url ? (
            <Image source={{ uri: reporte.image_url }} style={styles.foto} resizeMode="cover" />
          ) : (
            <View style={[styles.foto, styles.fotoPlaceholder]}>
              <CategoriaBadge categoria={categoriaPrincipal} size={48} />
            </View>
          )}

          <View style={styles.tarjetaCuerpo}>
            <View style={styles.filaTitulo}>
              <CategoriaBadge categoria={categoriaPrincipal} size={32} />
              <Text style={styles.tarjetaTitulo} numberOfLines={1}>
                {reporte.titulo}
              </Text>
            </View>

            <View style={styles.filaMeta}>
              <View style={styles.probable}>
                <Text style={styles.probableTexto}>Probable</Text>
              </View>
              <Text style={styles.metaTexto} numberOfLines={1}>
                {codigoReporte(reporte.id)} · {reporte.direccion ?? `${reporte.lat.toFixed(4)}, ${reporte.lng.toFixed(4)}`}
              </Text>
            </View>

            <View style={styles.filaConfirmaciones}>
              <UserIcon size={16} color={colors.slate} />
              <Text style={styles.confirmacionesTexto}>{reporte.upvotes} vecinos ya lo confirmaron</Text>
            </View>
          </View>
        </View>

        <View style={styles.info}>
          <InfoIcon size={18} color={colors.slate} />
          <Text style={styles.infoTexto}>
            Si es el mismo, confirmarlo ayuda a verificarlo más rápido y evita reportes repetidos. Tu foto se agrega
            al incidente.
          </Text>
        </View>
      </View>

      <View style={styles.pie}>
        {!!error && (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        )}
        <Pressable
          onPress={onConfirmar}
          disabled={confirmando}
          accessibilityRole="button"
          style={[styles.boton, styles.botonConfirmar, confirmando && styles.botonDeshabilitado]}
        >
          {confirmando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <CheckIcon size={20} color={colors.white} />
              <Text style={styles.botonConfirmarTexto}>Sí, es el mismo · confirmar</Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={onRechazar}
          disabled={confirmando}
          accessibilityRole="button"
          style={[styles.boton, styles.botonRechazar, confirmando && styles.botonDeshabilitado]}
        >
          <Text style={styles.botonRechazarTexto}>No, es otro · seguir reportando</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  cabecera: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    alignItems: 'center',
  },
  titulo: {
    fontFamily: fontFamily.bold,
    fontSize: 19,
    color: colors.ink,
    textAlign: 'center',
  },
  subtitulo: {
    marginTop: 4,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.slate,
    textAlign: 'center',
  },
  contenido: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  tarjeta: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    overflow: 'hidden',
    backgroundColor: '#f2f7ff',
  },
  foto: {
    width: '100%',
    height: 130,
  },
  fotoPlaceholder: {
    backgroundColor: colors.photoBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjetaCuerpo: {
    padding: 14,
    gap: 10,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tarjetaTitulo: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.ink,
  },
  filaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  probable: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#fff7ed',
  },
  probableTexto: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: colors.statusPendiente,
  },
  metaTexto: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.slate,
  },
  filaConfirmaciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmacionesTexto: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.linkBlue,
  },
  info: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  infoTexto: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.slate,
  },
  pie: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  boton: {
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botonConfirmar: {
    backgroundColor: colors.primary,
  },
  botonConfirmarTexto: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.white,
  },
  error: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.estadoError,
    textAlign: 'center',
  },
  botonRechazar: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
  },
  botonRechazarTexto: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.ink,
  },
  botonDeshabilitado: {
    opacity: 0.7,
  },
});
