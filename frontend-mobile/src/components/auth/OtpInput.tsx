import { useRef } from 'react';
import { NativeSyntheticEvent, StyleSheet, TextInput, TextInputKeyPressEventData, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';

const LENGTH = 4;

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function OtpInput({ value, onChange }: Props) {
  const inputs = useRef<Array<TextInput | null>>([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? '');

  const setDigit = (index: number, digit: string) => {
    const clean = digit.replace(/[^0-9]/g, '').slice(-1);
    const next = digits.slice();
    next[index] = clean;
    onChange(next.join(''));
    if (clean && index < LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputs.current[index] = ref;
          }}
          style={styles.box}
          value={digit}
          onChangeText={(text) => setDigit(index, text)}
          onKeyPress={(e) => handleKeyPress(index, e)}
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  box: {
    width: 74,
    height: 84,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.14)',
    backgroundColor: colors.white,
    fontFamily: fontFamily.semiBold,
    fontSize: 28,
    color: colors.textBody,
  },
});
