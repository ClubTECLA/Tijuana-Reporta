import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';

export type AuthTab = 'login' | 'signup';

type Props = {
  value: AuthTab;
  onChange: (tab: AuthTab) => void;
};

export function AuthTabs({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Tab label="Iniciar sesión" active={value === 'login'} onPress={() => onChange('login')} />
      <Tab label="Registrarse" active={value === 'signup'} onPress={() => onChange('signup')} />
    </View>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
    >
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f5f6f9',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.primaryLight,
  },
  tabLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: '#7d7d91',
  },
  tabLabelActive: {
    color: colors.white,
    fontFamily: fontFamily.semiBold,
  },
});
