import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { perfilColors, perfilRadius } from '../theme/perfilTokens';

interface MenuRowProps {
  icon: string; // temporal: emoji/texto. Cambiar por icono real cuando el equipo defina la librería.
  title: string;
  subtitle?: string;
  value?: string;
  danger?: boolean;
  onPress?: () => void;
  // Para filas tipo "Modo oscuro": en vez de flecha, se muestra un switch.
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  // Punto de notificación (como en el avatar de la captura de Figma).
  badgeCount?: number;
}

export const MenuRow = ({
  icon,
  title,
  subtitle,
  value,
  danger,
  onPress,
  switchValue,
  onSwitchChange,
  badgeCount,
}: MenuRowProps) => {
  const isSwitchRow = onSwitchChange !== undefined;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={isSwitchRow ? 1 : 0.7}
      disabled={isSwitchRow}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: danger ? perfilColors.dangerTint : perfilColors.primaryTint },
        ]}
      >
        <Text style={styles.icon}>{icon}</Text>
        {!!badgeCount && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
          </View>
        )}
      </View>
      <View style={styles.texts}>
        <Text style={[styles.title, danger && { color: perfilColors.danger }]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {isSwitchRow ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: perfilColors.divider, true: perfilColors.primary }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <>
          {value ? <Text style={styles.value}>{value}</Text> : null}
          <Text style={styles.chevron}>›</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: perfilRadius.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: perfilColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: perfilColors.card,
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  texts: { flex: 1, marginLeft: 12 },
  title: { fontSize: 16, fontWeight: '600', color: perfilColors.textPrimary },
  subtitle: { fontSize: 13, color: perfilColors.textSecondary, marginTop: 2 },
  value: { fontSize: 15, fontWeight: '700', color: perfilColors.primary, marginRight: 8 },
  chevron: { fontSize: 24, color: perfilColors.chevron },
});
