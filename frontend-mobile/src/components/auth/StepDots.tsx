import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

type Props = {
  total: number;
  current: number;
};

/** Puntos de progreso del flujo de "Recuperar contraseña" (1/3, 2/3, 3/3). */
export function StepDots({ total, current }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[styles.dot, i < current ? styles.dotActive : styles.dotInactive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  dot: {
    width: 48,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: colors.stepActive,
  },
  dotInactive: {
    backgroundColor: colors.stepInactive,
  },
});
