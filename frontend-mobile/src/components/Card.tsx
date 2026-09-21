import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { perfilColors, perfilRadius } from '../theme/perfilTokens';

export const Card = ({ style, children, ...props }: ViewProps) => (
  <View style={[styles.card, style]} {...props}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: perfilColors.card,
    borderRadius: perfilRadius.card,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
});
