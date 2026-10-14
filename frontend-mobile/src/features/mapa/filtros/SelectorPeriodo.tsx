import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import type { Periodo } from './types';

const OPCIONES: readonly { valor: Periodo; etiqueta: string }[] = [
  { valor: 'ahora', etiqueta: 'Ahora' },
  { valor: '24h', etiqueta: '24 horas' },
  { valor: '7d', etiqueta: '7 días' },
];

interface SelectorPeriodoProps {
  valor: Periodo;
  onCambio: (periodo: Periodo) => void;
}

// Selector segmentado del Figma (`Periodo`). No reutiliza `SegmentedTabs`: ese componente usa el
// valor como etiqueta ("24h" vs "24 horas"), otra tipografía y los colores del perfil.
export function SelectorPeriodo({ valor, onCambio }: SelectorPeriodoProps) {
  return (
    <View style={styles.contenedor} accessibilityRole="radiogroup">
      {OPCIONES.map(({ valor: opcion, etiqueta }) => {
        const activa = opcion === valor;
        return (
          <Pressable
            key={opcion}
            onPress={() => onCambio(opcion)}
            accessibilityRole="radio"
            accessibilityLabel={etiqueta}
            accessibilityState={{ selected: activa, checked: activa }}
            style={[styles.segmento, activa && styles.segmentoActivo]}
          >
            <Text style={[styles.texto, activa && styles.textoActivo]}>{etiqueta}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 999,
    backgroundColor: colors.bgCanvas,
  },
  segmento: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentoActivo: {
    backgroundColor: colors.white,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 1.5,
    shadowOffset: { width: 0, height: 1 },
  },
  texto: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: colors.textMuted,
  },
  textoActivo: {
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
});
