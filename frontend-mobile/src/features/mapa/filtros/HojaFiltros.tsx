import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet } from '@/components/BottomSheet';
import { BotonPildora } from '@/components/BotonPildora';
import { AlertTriangleIcon } from '@/components/icons/AlertTriangleIcon';
import { CerrarIcon } from '@/components/icons/CerrarIcon';
import { EscudoIcon } from '@/components/icons/EscudoIcon';
import { LocationPinIcon } from '@/components/icons/LocationPinIcon';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { useCategorias } from '@/features/reportes/hooks';
import { FILTROS_POR_DEFECTO } from './constantes';
import { ChipCategoria } from './ChipCategoria';
import { FilaCapa } from './FilaCapa';
import { SelectorPeriodo } from './SelectorPeriodo';
import { useFiltrosStore } from './filtrosStore';
import { alternarCategoria, categoriaActiva } from './seleccionCategorias';
import type { CategoriaFiltro, FiltrosMapa } from './types';

interface HojaFiltrosProps {
  visible: boolean;
  onClose: () => void;
}

const ICONO_CAPA = 20;

// Copia para que editar el borrador nunca toque el store ni FILTROS_POR_DEFECTO.
const copiar = (f: FiltrosMapa): FiltrosMapa => ({
  categorias: f.categorias && [...f.categorias],
  capas: { ...f.capas },
  periodo: f.periodo,
});

// Hoja "Capas y filtros" (Figma 14). Edita un borrador local que se copia del store cada vez que la
// hoja se abre; solo "Aplicar" lo manda al store, cualquier forma de cerrar lo descarta.
export function HojaFiltros({ visible, onClose }: HojaFiltrosProps) {
  const insets = useSafeAreaInsets();
  const aplicar = useFiltrosStore((s) => s.aplicar);
  const categorias = useCategorias();
  const [borrador, setBorrador] = useState<FiltrosMapa>(() => copiar(useFiltrosStore.getState().filtros));

  // Al abrir se parte siempre del estado aplicado (no se escucha `filtros`: no debe pisar la edición).
  useEffect(() => {
    if (visible) setBorrador(copiar(useFiltrosStore.getState().filtros));
  }, [visible]);

  const alternar = (slug: CategoriaFiltro) =>
    setBorrador((b) => ({
      ...b,
      // Se arma desde el catálogo para conservar su orden; al completarlas todas vuelve a `null` (todas).
      categorias: alternarCategoria(b.categorias, slug, categorias.map((c) => c.slug)),
    }));

  const cambiarCapa = (capa: keyof FiltrosMapa['capas'], activa: boolean) =>
    setBorrador((b) => ({ ...b, capas: { ...b.capas, [capa]: activa } }));

  const confirmar = () => {
    aplicar(borrador);
    onClose();
  };

  return (
    <BottomSheet isVisible={visible} onClose={onClose} maxHeightRatio={0.92}>
      <View style={styles.encabezado}>
        <View style={styles.titulos}>
          <Text style={styles.titulo} accessibilityRole="header">
            Capas y filtros
          </Text>
          <Text style={styles.subtitulo}>Elige qué quieres ver en el mapa</Text>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          style={({ pressed }) => [styles.cerrar, pressed && styles.presionado]}
        >
          <CerrarIcon color={colors.iconoOscuro} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
        <Text style={styles.seccion}>PERIODO</Text>
        <SelectorPeriodo valor={borrador.periodo} onCambio={(periodo) => setBorrador((b) => ({ ...b, periodo }))} />

        <Text style={styles.seccion}>CATEGORÍAS</Text>
        <View style={styles.chips}>
          {categorias.map((categoria) => (
            <ChipCategoria
              key={categoria.slug}
              categoria={categoria}
              activa={categoriaActiva(borrador.categorias, categoria.slug)}
              onPress={() => alternar(categoria.slug)}
            />
          ))}
        </View>

        <Text style={styles.seccion}>CAPAS</Text>
        <View style={styles.capas}>
          <FilaCapa
            icono={<LocationPinIcon size={ICONO_CAPA} color={colors.brand} />}
            titulo="Incidentes reportados"
            descripcion="Lo que reporta la comunidad"
            activa={borrador.capas.incidentes}
            onCambio={(v) => cambiarCapa('incidentes', v)}
          />
          <FilaCapa
            icono={<AlertTriangleIcon size={ICONO_CAPA} color={colors.brand} />}
            titulo="Zonas de riesgo estimado"
            descripcion="Calculadas con lluvia e historial"
            activa={borrador.capas.zonasRiesgo}
            onCambio={(v) => cambiarCapa('zonasRiesgo', v)}
          />
          <FilaCapa
            icono={<EscudoIcon size={ICONO_CAPA} color={colors.brand} />}
            titulo="Avisos oficiales"
            descripcion="Protección Civil y autoridades"
            activa={borrador.capas.avisosOficiales}
            onCambio={(v) => cambiarCapa('avisosOficiales', v)}
          />
        </View>
      </ScrollView>

      <View style={[styles.acciones, { paddingBottom: Math.max(insets.bottom, 0) + 16 }]}>
        <BotonPildora
          etiqueta="Limpiar"
          variante="secundario"
          onPress={() => setBorrador(copiar(FILTROS_POR_DEFECTO))}
          style={styles.accion}
        />
        <BotonPildora etiqueta="Aplicar" onPress={confirmar} style={styles.accion} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  encabezado: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 8,
    paddingBottom: 16,
    paddingLeft: 24,
    paddingRight: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  titulos: {
    flex: 1,
    gap: 4,
  },
  titulo: {
    fontFamily: fontFamily.bold,
    fontSize: 21,
    color: colors.textPrimary,
  },
  subtitulo: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  cerrar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presionado: {
    opacity: 0.85,
  },
  scroll: {
    flexShrink: 1,
  },
  contenido: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 18,
  },
  seccion: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    letterSpacing: 0.72,
    color: colors.textMuted,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  capas: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 18,
    overflow: 'hidden',
  },
  acciones: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  accion: {
    flex: 1,
    width: 'auto',
  },
});
