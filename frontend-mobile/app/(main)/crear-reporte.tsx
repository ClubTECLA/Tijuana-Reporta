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
import { SendUpIcon } from '@/components/icons/SendUpIcon';
import { useCrearReporte } from '@/features/reportes/useCrearReporte';
import { CategoriaCard } from '@/features/reportes/crear/CategoriaCard';
import { CerrarButton } from '@/features/reportes/crear/CerrarButton';
import { ReporteCreado } from '@/features/reportes/crear/ReporteCreado';
import { UbicacionActual } from '@/features/reportes/crear/UbicacionActual';
import {
  CATEGORIAS_PICKER,
  CATEGORIAS_VISIBLES,
  ETIQUETAS,
  ETIQUETAS_VISIBLES,
  etiquetaLabel,
} from '@/features/reportes/crear/categorias';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import type { CategoriaReporte } from '@/types/api';

const pares = <T,>(items: T[]): T[][] => {
  const filas: T[][] = [];
  for (let i = 0; i < items.length; i += 2) filas.push(items.slice(i, i + 2));
  return filas;
};

export default function CrearReporte() {
  const insets = useSafeAreaInsets();
  const { form, errors, isSubmitting, submitError, creado, setCategoria, toggleTag, setLocation, submit } =
    useCrearReporte();
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
    return <ReporteCreado reporte={creado} onVolver={() => router.back()} />;
  }

  const cerrar = () => router.back();
  const elegir = (categoria: CategoriaReporte) => {
    setCategoria(categoria);
    setExpandido(false);
  };
  const errorCategoria = !!errors.categoria;
  // Si se eligió una de las categorías que solo salen en "+ Ver mas", ocupa el último lugar visible.
  const visibles = CATEGORIAS_PICKER.slice(0, CATEGORIAS_VISIBLES);
  if (form.categoria && !visibles.includes(form.categoria)) visibles[visibles.length - 1] = form.categoria;
  const etiquetas = todasEtiquetas ? ETIQUETAS : ETIQUETAS.slice(0, ETIQUETAS_VISIBLES);

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
                      selected={form.categoria === cat}
                      onPress={() => elegir(cat)}
                    />
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
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
            <View style={[styles.grid, errorCategoria && styles.gridError]}>
              {pares(visibles).map((fila, i) => (
                <View key={i} style={styles.fila}>
                  {fila.map((cat) => (
                    <CategoriaCard
                      key={cat}
                      categoria={cat}
                      selected={form.categoria === cat}
                      dimmed={errorCategoria}
                      onPress={() => elegir(cat)}
                    />
                  ))}
                </View>
              ))}
            </View>

            {/* Foto */}
            <Text style={[styles.label, styles.seccionFoto]}>Foto (toma o sube una foto)</Text>
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

            {/* Descripción (etiquetas) */}
            <View style={[styles.filaLabel, styles.seccionDescripcion]}>
              <Text style={styles.label}>Descripción (opcional)</Text>
              {ETIQUETAS.length > ETIQUETAS_VISIBLES && (
                <Pressable onPress={() => setTodasEtiquetas((v) => !v)} accessibilityRole="button" hitSlop={8}>
                  <Text style={styles.verMas}>{todasEtiquetas ? '− Ver menos' : '+ Ver mas'}</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.chips}>
              {etiquetas.map((tag) => {
                const activa = form.tags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activa }}
                    style={[styles.chip, activa && styles.chipActivo]}
                  >
                    <Text style={[styles.chipTexto, activa && styles.chipTextoActivo]}>{etiquetaLabel(tag)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={[styles.pie, { paddingBottom: Math.max(insets.bottom, 0) + 8 }]}>
            {!!submitError && <Text style={[styles.error, styles.errorEnvio]}>{submitError}</Text>}
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
                  <SendUpIcon />
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
    paddingBottom: 12,
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
  chip: {
    paddingHorizontal: 14.7,
    paddingVertical: 7.4,
    borderRadius: 999,
    borderWidth: 1.434,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.white,
    elevation: 1,
  },
  chipActivo: {
    borderColor: colors.primary,
    backgroundColor: '#eaf2ff',
  },
  chipTexto: {
    fontFamily: fontFamily.medium,
    fontSize: 15.95,
    lineHeight: 23.9,
    color: colors.chipText,
  },
  chipTextoActivo: {
    color: colors.primary,
  },

  // ── Enviar ───────────────────────────────────────────────────────────────
  pie: {
    paddingHorizontal: 19,
    paddingTop: 8,
    backgroundColor: colors.white,
  },
  enviar: {
    height: 84,
    borderRadius: 48.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: colors.enviar,
  },
  enviarDeshabilitado: {
    opacity: 0.7,
  },
  enviarTexto: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 35.4,
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
