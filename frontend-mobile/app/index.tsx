import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../src/components/Button';
import { ReportBottomSheetTesting, ReportBottomSheetDefault } from '../src/components/ReportBottomSheet';
import { colors, spacing } from '../src/theme';

export default function Home() {
  const [showTesting, setShowTesting] = useState(false);
  const [showDefault, setShowDefault] = useState(false);

  return (
    <View style={styles.container}>
      {/* Mock del Mapa */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>📍 Mock del Mapa (Dev 2)</Text>
      </View>

      {/* Controles para Testeo UI */}
      <View style={styles.controls}>
        <Text style={styles.title}>A/B Testing UI</Text>
        
        <View style={styles.buttonWrapper}>
          <Button 
            title="Versión Testing (Grid Horizontal)" 
            onPress={() => setShowTesting(true)} 
          />
        </View>

        <View style={styles.buttonWrapper}>
          <Button 
            title="Versión Default (Lista Vertical)" 
            onPress={() => setShowDefault(true)} 
            variant="outline"
          />
        </View>
      </View>

      {/* Bottom Sheets */}
      <ReportBottomSheetTesting 
        isVisible={showTesting} 
        onClose={() => setShowTesting(false)} 
      />
      
      <ReportBottomSheetDefault 
        isVisible={showDefault} 
        onClose={() => setShowDefault(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E5E5EA', // Un gris para simular el mapa
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  controls: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2, // Espacio extra por si hay notch
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  buttonWrapper: {
    marginBottom: spacing.sm,
  }
});
