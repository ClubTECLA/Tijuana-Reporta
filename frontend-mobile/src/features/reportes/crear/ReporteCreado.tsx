import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Reporte } from '@/types/api';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { CheckCircleIcon } from '@/components/icons/CheckCircleIcon';
import { FileTextIcon } from '@/components/icons/FileTextIcon';
import { MapIcon } from '@/components/icons/MapIcon';
import { CategoriaBadge } from './CategoriaBadge';
import { CATEGORIA_LABEL, etiquetaLabel } from './categorias';
import { codigoReporte } from './codigo';

interface ReporteCreadoProps {
  reporte: Reporte;
  /** true si se llegó aquí confirmando "¿Es el mismo incidente?" en vez de crear uno nuevo. */
  viaDuplicado?: boolean;
  onVer: () => void;
  onVolver: () => void;
}

// "inundación", "inundación y socavón", "inundación, socavón y árbol".
const listarCategorias = (reporte: Reporte) => {
  const nombres = reporte.categorias.map((c) => CATEGORIA_LABEL[c].toLowerCase());
  return nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}` : nombres[0];
};

const hora = (fecha: Date) =>
  `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;

// Hoja "Reporte creado" (Figma 1396:9541) sobre el mapa oscurecido; con
// `viaDuplicado` es la variante "Reporte enviado" (Figma 1505:1650).
export function ReporteCreado({ reporte, viaDuplicado = false, onVer, onVolver }: ReporteCreadoProps) {
  const insets = useSafeAreaInsets();
  const categoriaPrincipal = reporte.categorias[0];
  const recibido = viaDuplicado ? new Date() : new Date(reporte.created_at);
  const verbo = viaDuplicado ? 'enviado' : 'creado';

  return (
    <View style={styles.root}>
      <View style={styles.hoja}>
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.contenido, { paddingBottom: Math.max(insets.bottom, 0) + 32 }]}
        >
          <View style={styles.encabezado}>
            <View style={styles.icono}>
              <CheckCircleIcon size={40} color={colors.successIcon} />
            </View>
            <Text style={styles.titulo}>{viaDuplicado ? '¡Reporte Enviado!' : '¡Reporte Creado!'}</Text>
            <Text style={styles.subtitulo}>
              Tu reporte de {listarCategorias(reporte)} fue {verbo} con éxito
            </Text>
          </View>

          <View style={styles.tarjeta}>
            {reporte.image_url ? (
              <Image source={{ uri: reporte.image_url }} style={styles.foto} resizeMode="cover" />
            ) : (
              <View style={[styles.foto, styles.fotoVacia]}>
                <CategoriaBadge categoria={categoriaPrincipal} size={64} glyphScale={1.2} />
              </View>
            )}
            <View style={styles.cuerpo}>
              <View style={styles.filaTitulo}>
                <CategoriaBadge categoria={categoriaPrincipal} size={32} />
                <View style={styles.titulos}>
                  <Text style={styles.codigo}>{codigoReporte(reporte.id)}</Text>
                  <Text style={styles.recibido}>Recibido hoy {hora(recibido)} · pendiente de revisión</Text>
                </View>
              </View>
              <View style={styles.probable}>
                <View style={styles.punto} />
                <Text style={styles.probableTexto}>Probable</Text>
              </View>
              {reporte.tags.length > 0 && (
                <View style={styles.etiquetas}>
                  {reporte.tags.map((tag) => (
                    <View key={tag} style={styles.etiqueta}>
                      <Text style={styles.etiquetaTexto}>{etiquetaLabel(tag)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          <Pressable onPress={onVer} accessibilityRole="button" style={[styles.boton, styles.botonRojo]}>
            <FileTextIcon size={22} color={colors.white} />
            <Text style={styles.botonTexto}>Ver reporte</Text>
          </Pressable>
          <Pressable onPress={onVolver} accessibilityRole="button" style={[styles.boton, styles.botonAzul]}>
            <MapIcon size={22} color={colors.white} />
            <Text style={styles.botonTexto}>Volver al mapa</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.scrim,
  },
  hoja: {
    maxHeight: '88%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    elevation: 16,
  },
  contenido: {
    paddingTop: 38,
    paddingHorizontal: 24,
    gap: 21,
  },
  encabezado: {
    alignItems: 'center',
    gap: 9,
  },
  icono: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.successSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    marginTop: 4,
    fontFamily: fontFamily.bold,
    fontSize: 21,
    color: colors.textPrimary,
  },
  subtitulo: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  tarjeta: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.cardSecondary,
    overflow: 'hidden',
  },
  foto: {
    width: '100%',
    height: 170,
    borderRadius: 16,
  },
  fotoVacia: {
    backgroundColor: colors.photoBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuerpo: {
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  titulos: {
    flex: 1,
    gap: 2,
  },
  codigo: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  recibido: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  probable: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.etiquetaAdvertenciaBg,
  },
  punto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.etiquetaAdvertenciaText,
  },
  probableTexto: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: colors.etiquetaAdvertenciaText,
  },
  etiquetas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  etiqueta: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.infoSubtle,
  },
  etiquetaTexto: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.brandText,
  },
  boton: {
    height: 60,
    borderRadius: 999,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 4,
  },
  botonRojo: {
    backgroundColor: colors.reportRed,
    shadowColor: colors.reportRed,
  },
  botonAzul: {
    backgroundColor: colors.brand,
    shadowColor: colors.brand,
  },
  botonTexto: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.white,
  },
});
