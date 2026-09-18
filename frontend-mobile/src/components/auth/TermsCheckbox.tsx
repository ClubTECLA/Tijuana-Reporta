import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function TermsCheckbox({ checked, onChange }: Props) {
  return (
    <Pressable style={styles.row} onPress={() => onChange(!checked)}>
      <View style={[styles.box, checked && styles.boxChecked]} />
      <Text style={styles.label}>
        Acepto los Términos de servicio y el Aviso de privacidad de Tijuana Reporta.
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.checkboxBorder,
    marginTop: 2,
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
});
