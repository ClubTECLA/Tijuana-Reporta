import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { perfilColors } from '../theme/perfilTokens';

interface ScreenHeaderProps {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

const TOP_INSET = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 54;

export const ScreenHeader = ({ title, onBack, right }: ScreenHeaderProps) => (
  <View style={styles.container}>
    <TouchableOpacity
      onPress={onBack}
      style={styles.backButton}
      accessibilityRole="button"
      accessibilityLabel="Volver"
    >
      <Text style={styles.backIcon}>‹</Text>
    </TouchableOpacity>
    {title ? <Text style={styles.title}>{title}</Text> : null}
    <View style={styles.right}>{right}</View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingTop: TOP_INSET + 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: perfilColors.divider,
  },
  backIcon: { fontSize: 28, lineHeight: 30, color: perfilColors.textPrimary },
  title: {
    marginLeft: 12,
    fontSize: 22,
    fontWeight: '700', // Inter Bold 22 en el Figma
    color: perfilColors.textPrimary,
    flex: 1,
  },
  right: { marginLeft: 'auto' },
});
