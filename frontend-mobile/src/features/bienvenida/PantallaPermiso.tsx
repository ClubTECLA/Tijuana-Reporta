import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BotonPildora } from '@/components/BotonPildora';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { IlustracionMapa } from './IlustracionMapa';

const PASOS = 2;
// En el Figma el botón queda a ~50 px del borde inferior de la pantalla.
const MARGEN_INFERIOR = 50;

interface Punto {
  icono: ReactNode;
  texto: string;
}

interface PantallaPermisoProps {
  /** Índice del paso (0 = ubicación, 1 = alertas) para la barra de progreso. */
  paso: number;
  /** Lo que va sobre el mapa, en coordenadas del Figma (ver `IlustracionMapa`). */
  ilustracion: ReactNode;
  titulo: string;
  descripcion: string;
  puntos: Punto[];
  boton: { etiqueta: string; icono: ReactNode; onPress: () => void; cargando: boolean };
}

// Plantilla de las pantallas "Activa tu ubicación" (Figma 1) y "Recibe alertas cercanas" (Figma 2).
export function PantallaPermiso({ paso, ilustracion, titulo, descripcion, puntos, boton }: PantallaPermisoProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(MARGEN_INFERIOR, insets.bottom + 16) }]}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      <IlustracionMapa>{ilustracion}</IlustracionMapa>

      <View style={styles.contenido}>
        <View style={styles.progreso} accessibilityLabel={`Paso ${paso + 1} de ${PASOS}`}>
          {Array.from({ length: PASOS }, (_, i) => (
            <View key={i} style={[styles.progresoPunto, i === paso && styles.progresoActivo]} />
          ))}
        </View>
        <Text style={styles.titulo} accessibilityRole="header">
          {titulo}
        </Text>
        <Text style={styles.descripcion}>{descripcion}</Text>
        <View style={styles.puntos}>
          {puntos.map(({ icono, texto }) => (
            <View key={texto} style={styles.punto}>
              {icono}
              <Text style={styles.puntoTexto}>{texto}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.espacio} />

      <View style={styles.acciones}>
        <BotonPildora etiqueta={boton.etiqueta} icono={boton.icono} onPress={boton.onPress} cargando={boton.cargando} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    flexGrow: 1,
  },
  contenido: {
    marginTop: 10,
    paddingHorizontal: 24,
    gap: 16,
  },
  progreso: {
    flexDirection: 'row',
    gap: 6,
  },
  progresoPunto: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: colors.divider,
  },
  progresoActivo: {
    width: 28,
    backgroundColor: colors.brand,
  },
  titulo: {
    fontFamily: fontFamily.bold,
    fontSize: 30,
    lineHeight: 36,
    color: colors.textPrimary,
  },
  descripcion: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  puntos: {
    paddingTop: 6,
    gap: 12,
  },
  punto: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  puntoTexto: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  espacio: {
    flex: 1,
    minHeight: 32,
  },
  acciones: {
    paddingHorizontal: 24,
  },
});
