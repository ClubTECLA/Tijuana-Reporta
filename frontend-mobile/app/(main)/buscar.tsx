import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftIcon } from '@/components/icons/ArrowLeftIcon';
import { ClockIcon } from '@/components/icons/ClockIcon';
import { LugarResultado } from '@/features/mapa/buscar/LugarResultado';
import { useLugares } from '@/features/lugares/hooks';
import { useRecientesStore } from '@/features/lugares/recientesStore';
import { useMapaTargetStore } from '@/features/mapa/mapaTargetStore';
import type { LugarResultado as LugarResultadoType } from '@/features/lugares/types';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

const DEBOUNCE_MS = 500;
const MIN_QUERY = 3;

/** Muestra búsquedas de lugares con espera entre consultas y accesos a los lugares recientes. */
export default function BuscarScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const { data: resultados = [], isLoading, isError } = useLugares(debounced);
  const recientes = useRecientesStore((s) => s.lugares);
  const agregarReciente = useRecientesStore((s) => s.agregar);
  const setTarget = useMapaTargetStore((s) => s.setTarget);

  /** Guarda el lugar en recientes, lo fija como destino del mapa y vuelve a la pantalla anterior. */
  const seleccionar = (lugar: LugarResultadoType) => {
    agregarReciente(lugar);
    setTarget({ lat: lugar.lat, lng: lugar.lng, nombre: lugar.nombre });
    router.back();
  };

  const mostrarResultados = debounced.trim().length >= MIN_QUERY;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver al mapa"
          style={styles.backBtn}
        >
          <ArrowLeftIcon size={20} color={colors.textSecondary} />
        </Pressable>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar dirección"
          placeholderTextColor={colors.labelSecondary}
          autoFocus
          returnKeyType="search"
        />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {mostrarResultados && (
          <View style={styles.seccion}>
            <Text style={styles.seccionLabel}>RESULTADOS</Text>
            {isLoading && <ActivityIndicator color={colors.slate} style={styles.estado} />}
            {isError && (
              <Text style={styles.estadoTexto}>No se pudo buscar. Revisa tu conexión e intenta de nuevo.</Text>
            )}
            {!isLoading && !isError && resultados.length === 0 && (
              <Text style={styles.estadoTexto}>Sin resultados para &quot;{debounced}&quot;.</Text>
            )}
            {resultados.length > 0 && (
              <View style={styles.lista}>
                {resultados.map((lugar, i) => (
                  <LugarResultado
                    key={lugar.id}
                    lugar={lugar}
                    onPress={() => seleccionar(lugar)}
                    conBorde={i < resultados.length - 1}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {recientes.length > 0 && (
          <View style={styles.seccion}>
            <Text style={styles.seccionLabel}>RECIENTES</Text>
            {recientes.map((lugar) => (
              <Pressable
                key={lugar.id}
                onPress={() => seleccionar(lugar)}
                accessibilityRole="button"
                style={styles.recienteFila}
              >
                <ClockIcon size={18} color={colors.textSecondary} />
                <Text style={styles.recienteTexto} numberOfLines={1}>
                  {lugar.nombre}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 60,
    marginHorizontal: 16,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgCanvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 17,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 24,
  },
  seccion: {
    gap: 12,
  },
  seccionLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    letterSpacing: 0.72,
    color: colors.textMuted,
  },
  lista: {
    backgroundColor: colors.white,
    borderRadius: 18,
    overflow: 'hidden',
  },
  estado: {
    paddingVertical: 12,
  },
  estadoTexto: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  recienteFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  recienteTexto: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
});
