import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraIcon } from '@/components/icons/CameraIcon';
import { SendIcon } from '@/components/icons/SendIcon';
import { useMapaTargetStore } from '@/features/mapa/mapaTargetStore';
import { useEnLinea } from '@/lib/red';
import { useCrearReporte } from '@/features/reportes/useCrearReporte';
import { CategoriaCard } from '@/features/reportes/crear/CategoriaCard';
import { CategoriaChip } from '@/features/reportes/crear/CategoriaChip';
import { CerrarButton } from '@/features/reportes/crear/CerrarButton';
import { ReporteCreado } from '@/features/reportes/crear/ReporteCreado';
import { ReporteDuplicado } from '@/features/reportes/crear/ReporteDuplicado';
import { EtiquetaChip } from '@/features/reportes/crear/EtiquetaChip';
import { UbicacionActual } from '@/features/reportes/crear/UbicacionActual';
import {
  CATEGORIAS_PICKER,
  CATEGORIAS_VISIBLES,
  etiquetaPrincipal,
  etiquetasDe,
} from '@/features/reportes/crear/categorias';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

const pares = <T,>(items: T[]): T[][] => {
  const filas: T[][] = [];
  for (let i = 0; i < items.length; i += 2) filas.push(items.slice(i, i + 2));
  return filas;
};

export default function CrearReporte() {
  const insets = useSafeAreaInsets();
  const {
    form,
    errors,
    isSubmitting,
    submitError,
    creado,
    creadoViaDuplicado,
    duplicado,
    toggleCategoria,
    toggleTag,
    setLocation,
    submit,
    confirmarEsElMismo,
    seguirReportando,
  } = useCrearReporte();
  const setTarget = useMapaTargetStore((s) => s.setTarget);
  const enLinea = useEnLinea();
  const [expandido, setExpandido] = useState(false);
  const [todasEtiquetas, setTodasEtiquetas] = useState(false);
  const slide = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    Animated.timing(slide, { toValue: 0, duration: 260, useNativeDriver: true }).start();
  }, [slide]);

  useEffect(() => {
    if (!expandido) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setExpandido(false);
      return true;
    });
    return () => sub.remove();
  }, [expandido]);

  if (creado) {
    return (
      <ReporteCreado
        reporte={creado}
        viaDuplicado={creadoViaDuplicado}
        onVer={() => {
          setTarget({ lat: creado.lat, lng: creado.lng, nombre: creado.titulo, reporteId: creado.id });
          router.back();
        }}
        onVolver={() => router.back()}
      />
    );
  }

  const cerrar = () => router.back();
  const errorCategoria = !!errors.categoria;
  const visibles = CATEGORIAS_PICKER.slice(0, CATEGORIAS_VISIBLES);
  // Categorías elegidas desde "+ Ver mas" que no tienen tarjeta en la grilla: van como chips quitables.
  const fueraDeGrilla = form.categorias.filter((c) => !visibles.includes(c));
  // Información adicional: solo hay etiquetas de las categorías elegidas (con su color). Contraída, la
  // etiqueta por defecto de cada una más las que el usuario haya activado; con "Ver mas", el resto
  // de las etiquetas de esas mismas categorías.
  const deLasElegidas = form.categorias.flatMap(etiquetasDe);
  const contraidas = deLasElegidas.filter(
    ({ id, categoria }) => form.tags.includes(id) || id === etiquetaPrincipal(categoria),
  );
  const hayMasEtiquetas = contraidas.length < deLasElegidas.length;
  const etiquetas = todasEtiquetas && hayMasEtiquetas ? deLasElegidas : contraidas;

  return (
    <View style={styles.root}>
      <Pressable style={styles.backdrop} onPress={cerrar} accessibilityLabel="Cerrar" />

      {/* ── Lista expandida de categorías ("+ Ver mas") ─────────────────── */}
      {expandido ? (
        <View
          style={[
            styles.expandido,
            { top: insets.top + 60, maxHeight: Dimensions.get('window').height - (insets.top + 60) - (Math.max(insets.bottom, 0) + 53) },
          ]}
        >
          <ScrollView contentContainerStyle={styles.expandidoContenido} showsVerticalScrollIndicator={false}>
            <View style={styles.expandidoCabecera}>
              <Text style={[styles.label, styles.expandidoLabel]}>¿Qué está pasando?</Text>
              <CerrarButton variant="rojo" onPress={() => setExpandido(false)} />
            </View>
            <View style={styles.grid}>
              {pares(CATEGORIAS_PICKER).map((fila, i) => (
                <View key={i} style={styles.fila}>
                  {fila.map((cat) => (
                    <CategoriaCard
                      key={cat}
                      compact
                      categoria={cat}
                      selected={form.categorias.includes(cat)}
                      onPress={() => toggleCategoria(cat)}
                    />
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : duplicado ? (
        /* ── "¿Es el mismo incidente?" ───────────────────────────────────── */
        <View style={styles.duplicadoWrap}>
          <ReporteDuplicado
            reporte={duplicado.reporte}
            distanciaM={duplicado.distanciaM}
            confirmando={isSubmitting}
            error={submitError}
            onConfirmar={() => void confirmarEsElMismo()}
            onRechazar={() => void seguirReportando()}
          />
        </View>
      ) : (
        /* ── Hoja "Reportar un incidente" ────────────────────────────────── */
        <Animated.View style={[styles.sheet, { top: insets.top + 8, transform: [{ translateY: slide }] }]}>
          <View style={styles.cabecera}>
            <View>
              <Text style={styles.titulo}>Reportar un incidente</Text>
              <Text style={styles.subtitulo}>Tu reporte ayuda a toda la comunidad</Text>
            </View>
            <CerrarButton onPress={cerrar} />
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.contenido}
            showsVerticalScrollIndicator={false}
          >
            {/* Ubicación */}
            <Text style={styles.label}>Ubicación (Actual)</Text>
            <View style={styles.mapaWrap}>
              <UbicacionActual lat={form.lat} lng={form.lng} onLocationChange={setLocation} />
            </View>
            {!!errors.ubicacion && <Text style={styles.error}>{errors.ubicacion}</Text>}

            {/* Categoría */}
            <View style={[styles.filaLabel, styles.seccionCategoria]}>
              <Text style={[styles.label, errorCategoria && styles.labelError]}>
                {errorCategoria ? '¿Qué está pasando? · OBLIGATORIO' : '¿Qué está pasando?'}
              </Text>
              <Pressable onPress={() => setExpandido(true)} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.verMas}>+ Ver mas</Text>
              </Pressable>
            </View>
            {fueraDeGrilla.length > 0 && (
              <View style={styles.chipsSeleccionadas}>
                {fueraDeGrilla.map((cat) => (
                  <CategoriaChip key={cat} categoria={cat} onQuitar={() => toggleCategoria(cat)} />
                ))}
              </View>
            )}
            <View style={[styles.grid, errorCategoria && styles.gridError]}>
              {pares(visibles).map((fila, i) => (
                <View key={i} style={styles.fila}>
                  {fila.map((cat) => (
                    <CategoriaCard
                      key={cat}
                      categoria={cat}
                      selected={form.categorias.includes(cat)}
                      dimmed={errorCategoria}
                      onPress={() => toggleCategoria(cat)}
                    />
                  ))}
                </View>
              ))}
            </View>

            {/* Foto */}
            <Text style={[styles.label, styles.seccionFoto]}>toma o sube una foto (opcional)</Text>
            {/* TODO: habilitar con expo-image-picker (requiere reconstruir el dev client). */}
            <Pressable
              style={[styles.foto, styles.fotoDeshabilitada]}
              disabled
              accessibilityRole="button"
              accessibilityLabel="Tomar o subir una foto (próximamente)"
              accessibilityState={{ disabled: true }}
            >
              <CameraIcon />
            </Pressable>

            {/* Información adicional (etiquetas por categoría) */}
            <View style={[styles.filaLabel, styles.seccionDescripcion]}>
              <Text style={styles.label}>Información adicional</Text>
              {hayMasEtiquetas && (
                <Pressable onPress={() => setTodasEtiquetas((v) => !v)} accessibilityRole="button" hitSlop={8}>
                  <Text style={styles.verMas}>{todasEtiquetas ? '− Ver menos' : '+ Ver mas'}</Text>
                </Pressable>
              )}
            </View>
            {etiquetas.length === 0 ? (
              <Text style={styles.etiquetasVacio}>Elige qué está pasando para ver etiquetas sugeridas.</Text>
            ) : (
              <View style={styles.chips}>
                {etiquetas.map(({ id, categoria }) => (
                  <EtiquetaChip
                    key={id}
                    etiqueta={id}
                    categoria={categoria}
                    activa={form.tags.includes(id)}
                    onPress={() => toggleTag(id)}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          <View style={[styles.pie, { paddingBottom: Math.max(insets.bottom, 0) + 12 }]}>
            {!!submitError && (
              <Text style={[styles.error, styles.errorEnvio]} accessibilityLiveRegion="polite">
                {submitError}
              </Text>
            )}
            {!enLinea && !submitError && (
              <Text style={styles.avisoSinConexion}>
                Sin conexión: tu reporte no se podrá enviar hasta que vuelvas a estar en línea.
              </Text>
            )}
            <Pressable
              onPress={() => void submit()}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Enviar reporte"
              style={[styles.enviar, isSubmitting && styles.enviarDeshabilitado]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <SendIcon size={22} />
                  <Text style={styles.enviarTexto}>Enviar reporte</Text>
                </>
              )}
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.backdrop,
  },

  // ── Hoja ─────────────────────────────────────────────────────────────────
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 17.575,
    borderTopRightRadius: 17.575,
    borderWidth: 1.307,
    borderBottomWidth: 0,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    elevation: 16,
  },
  cabecera: {
    height: 78.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 17.6,
    paddingRight: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1.307,
    borderBottomColor: colors.borderSubtle,
  },
  titulo: {
    fontFamily: fontFamily.bold,
    fontSize: 17.575,
    lineHeight: 26.36,
    letterSpacing: -0.4394,
    color: colors.ink,
  },
  subtitulo: {
    fontFamily: fontFamily.regular,
    fontSize: 13.18,
    lineHeight: 19.77,
    color: colors.slate,
  },
  contenido: {
    paddingHorizontal: 19,
    paddingTop: 14,
    paddingBottom: 24,
  },

  // ── Secciones ────────────────────────────────────────────────────────────
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    lineHeight: 18.12,
    letterSpacing: 0.3021,
    textTransform: 'uppercase',
    color: colors.labelMuted,
  },
  labelError: {
    color: colors.errorLabel,
  },
  filaLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verMas: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.linkBlue,
  },
  mapaWrap: {
    marginTop: 5.4,
  },
  seccionCategoria: {
    marginTop: 22,
  },
  seccionFoto: {
    marginTop: 21,
  },
  seccionDescripcion: {
    marginTop: 24,
  },
  error: {
    marginTop: 4,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.errorLabel,
  },
  errorEnvio: {
    marginBottom: 8,
    textAlign: 'center',
  },
  avisoSinConexion: {
    marginBottom: 8,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.slate,
    textAlign: 'center',
  },

  duplicadoWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  chipsSeleccionadas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    paddingHorizontal: 6,
  },

  // ── Cuadrícula de categorías ─────────────────────────────────────────────
  grid: {
    marginTop: 9.6,
    gap: 3.5,
  },
  gridError: {
    // Recuadro rojo punteado que rodea la cuadrícula sin mover el layout.
    marginHorizontal: -6,
    marginTop: 3.6,
    marginBottom: -6,
    padding: 4,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.errorBorder,
    borderRadius: 22,
    backgroundColor: colors.errorFill,
  },
  fila: {
    flexDirection: 'row',
    gap: 3.6,
  },

  // ── Foto ─────────────────────────────────────────────────────────────────
  foto: {
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

  fotoDeshabilitada: {
    opacity: 0.6,
  },

  // ── Etiquetas ────────────────────────────────────────────────────────────
  chips: {
    marginTop: 7,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9.8,
  },
  etiquetasVacio: {
    marginTop: 8,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.labelMuted,
  },

  // ── Enviar ───────────────────────────────────────────────────────────────
  pie: {
    paddingHorizontal: 19,
    paddingTop: 12,
    backgroundColor: colors.white,
  },
  // Botón "Enviar reporte" (Figma 16, Button/Enviar reporte): 60 px, píldora roja, icono de 22 px.
  enviar: {
    height: 60,
    borderRadius: 999,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.reportRed,
    elevation: 4,
    shadowColor: colors.reportRed,
  },
  enviarDeshabilitado: {
    opacity: 0.7,
  },
  enviarTexto: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.white,
  },

  // ── Lista expandida ──────────────────────────────────────────────────────
  expandido: {
    position: 'absolute',
    left: 14,
    right: 14,
    backgroundColor: colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 16,
  },
  expandidoContenido: {
    padding: 17,
    paddingBottom: 24,
  },
  expandidoCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandidoLabel: {
    fontSize: 14.08,
    letterSpacing: 0.2835,
  },
});
