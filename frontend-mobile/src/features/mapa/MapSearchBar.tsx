import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { LocationPinIcon } from '@/components/icons/LocationPinIcon';
import { ProfileIcon } from '@/components/icons/ProfileIcon';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

interface MapSearchBarProps extends TextInputProps {
  onProfilePress?: () => void;
}

export function MapSearchBar({ onProfilePress, ...inputProps }: MapSearchBarProps) {
  return (
    <View style={styles.pill}>
      <View style={styles.badge}>
        <LocationPinIcon size={25.6444} />
      </View>
      <TextInput
        style={styles.input}
        placeholder="Buscar dirección"
        placeholderTextColor={colors.labelSecondary}
        {...inputProps}
      />
      <Pressable
        onPress={onProfilePress}
        accessibilityRole="button"
        accessibilityLabel="Perfil"
        style={styles.profile}
      >
        <ProfileIcon />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 69.271,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 17,
    paddingRight: 17.6,
    gap: 13.5,
    borderRadius: 999,
    borderWidth: 1.527,
    borderColor: colors.borderSubtle,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#1f2733',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  badge: {
    width: 46.16,
    height: 46.16,
    borderRadius: 23.08,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 23.973,
    lineHeight: 31.024,
    letterSpacing: -0.1128,
    color: colors.textBody,
    paddingVertical: 0,
  },
  profile: {
    width: 43.373,
    height: 43.373,
    borderRadius: 21.69,
    borderWidth: 1.606,
    borderColor: colors.outlineUser,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
