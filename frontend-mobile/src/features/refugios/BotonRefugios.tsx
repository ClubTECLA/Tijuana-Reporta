import { Pressable, StyleSheet } from 'react-native';
import { AlertIcon } from '@/components/icons/AlertIcon';
import { CarpaIcon } from '@/components/icons/CarpaIcon';
import { colors } from '@/theme/colors';
import type { CapasMapa } from './capasMapa';

interface BotonRefugiosProps {
  /** Capas que el mapa muestra ahora; el botón ofrece pasar a la siguiente. */
  capas: CapasMapa;
  onPress: () => void;
}

// Lo que hará el siguiente toque, para el lector de pantalla.
const ETIQUETA: Record<CapasMapa, string> = {
  incidentes: 'Mostrar refugios junto a los incidentes',
  ambos: 'Mostrar solo refugios',
  refugios: 'Volver a los incidentes',
};

/**
 * Botón de refugios del mapa (Figma 10.1 · refugio, y 10.2 en el estado "solo refugios"). Círculo blanco como el de
 * capas. Con incidentes y refugios a la vez la carpa se tiñe de azul; con solo refugios el círculo se llena de azul
 * y pasa a la alerta, que es el ícono con el que el Figma regresa a los incidentes.
 */
export function BotonRefugios({ capas, onPress }: BotonRefugiosProps) {
  const soloRefugios = capas === 'refugios';
  const activo = capas !== 'incidentes';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={ETIQUETA[capas]}
      accessibilityState={{ selected: activo }}
      style={({ pressed }) => [
        styles.boton,
        capas === 'ambos' && styles.ambos,
        soloRefugios && styles.soloRefugios,
        pressed && styles.presionado,
      ]}
    >
      {soloRefugios ? (
        <AlertIcon size={25} color={colors.white} />
      ) : (
        <CarpaIcon color={capas === 'ambos' ? colors.brand : colors.iconoOscuro} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    width: 49,
    height: 49,
    borderRadius: 25,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 2.8,
    shadowOffset: { width: 0, height: 0 },
  },
  ambos: {
    backgroundColor: colors.infoSubtle,
    borderColor: colors.brand,
  },
  soloRefugios: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  presionado: {
    opacity: 0.85,
  },
});
