import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';
import { EyeIcon } from '../icons/EyeIcon';

type Props = Omit<TextInputProps, 'secureTextEntry'> & {
  label: string;
};

export function PasswordField({ label, style, ...inputProps }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputArea}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.inputPlaceholder}
          secureTextEntry={!visible}
          {...inputProps}
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={10}
          style={styles.eyeButton}
        >
          <EyeIcon open={visible} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 6,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    paddingRight: 16,
    shadowColor: '#e4e5e7',
    shadowOpacity: 0.24,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  input: {
    flex: 1,
    height: 54,
    paddingHorizontal: 16,
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: colors.textBody,
  },
  eyeButton: {
    paddingLeft: 8,
  },
});
