import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LocationPinIcon } from '@/components/icons/LocationPinIcon';
import { ProfileIcon } from '@/components/icons/ProfileIcon';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

interface MapSearchBarProps {
  onPress?: () => void;
  onProfilePress?: () => void;
}

/**
 * Se ve como un input pero es un botón: al tocarlo se abre la pantalla
 * "Buscar dirección" (app/(main)/buscar.tsx), que sí tiene el TextInput real.
 */
export function MapSearchBar({ onPress, onProfilePress }: MapSearchBarProps) {
  return (
    <View style={styles.pill}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Buscar dirección" style={styles.field}>
        <View style={styles.badge}>
          <LocationPinIcon size={25.6444} />
        </View>
        <Text style={styles.input}>Buscar dirección</Text>
      </Pressable>
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
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 13.5,
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
