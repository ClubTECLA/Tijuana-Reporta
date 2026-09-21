import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { perfilColors } from '../theme/perfilTokens';

interface AvatarProps {
  nombre: string;
  size?: number;
}

const iniciales = (nombre: string) =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');

export const Avatar = ({ nombre, size = 80 }: AvatarProps) => (
  <View
    style={[
      styles.circle,
      { width: size, height: size, borderRadius: size / 2 },
    ]}
  >
    <Text style={[styles.text, { fontSize: size * 0.32 }]}>{iniciales(nombre)}</Text>
  </View>
);

const styles = StyleSheet.create({
  circle: {
    backgroundColor: perfilColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: '#FFFFFF', fontWeight: '600' },
});
