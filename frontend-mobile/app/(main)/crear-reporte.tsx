import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useCrearReporte } from '../../src/hooks/useCrearReporte';
import { FormField } from '../../src/components/FormField';
import { CategorySelector } from '../../src/components/CategorySelector';
import { UbicacionPicker } from '../../src/components/UbicacionPicker';
import { colors } from '../../src/theme/colors';
import { fontFamily } from '../../src/theme/typography';

export default function CrearReporte() {
  const { form, errors, isSubmitting, submitSuccess, setField, setLocation, submit } =
    useCrearReporte();

  const handleSubmit = async () => {
    await submit();
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitSuccess) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>¡Reporte enviado!</Text>
        <Text style={styles.successSubtitle}>
          Tu reporte fue registrado. La comunidad y las autoridades lo verán pronto.
        </Text>
        <TouchableOpacity
          style={styles.backToMapButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backToMapButtonText}>Volver al mapa</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Form state ─────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Reporte</Text>
        {/* Spacer to center title */}
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Título */}
        <FormField
          label="Título"
          value={form.titulo}
          onChangeText={(text) => setField('titulo', text)}
          placeholder="Título corto, ej. Bache en el carril derecho"
          error={errors.titulo}
        />

        {/* Descripción */}
        <View style={styles.section}>
          <FormField
            label="Descripción"
            value={form.descripcion}
            onChangeText={(text) => setField('descripcion', text)}
            placeholder="Cuéntanos qué pasa y desde cuándo..."
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Categoría */}
        <View style={styles.section}>
          <CategorySelector
            value={form.categoria}
            onChange={(cat) => setField('categoria', cat)}
            error={errors.categoria}
          />
        </View>

        {/* Ubicación */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Ubicación</Text>
          <UbicacionPicker
            lat={form.lat}
            lng={form.lng}
            address={form.direccion}
            onLocationChange={setLocation}
          />
          {!!errors.ubicacion && (
            <Text style={styles.fieldError}>{errors.ubicacion}</Text>
          )}
        </View>

        {/* Foto placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Foto (opcional)</Text>
          <TouchableOpacity
            style={styles.photoPlaceholder}
            activeOpacity={0.7}
            onPress={() => console.log('TODO: photo')}
          >
            <Text style={styles.photoEmoji}>📷</Text>
            <Text style={styles.photoText}>Agregar foto</Text>
          </TouchableOpacity>
        </View>

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Reportar incidente</Text>
          )}
        </TouchableOpacity>

        {/* Bottom padding for safe area */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceHover,
  },
  backButton: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 22,
    color: colors.headingDark,
    fontFamily: fontFamily.regular,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fontFamily.semiBold,
    fontSize: 17,
    color: colors.headingDark,
  },

  // ── Scroll content ────────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  section: {
    marginTop: 24,
  },

  sectionLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.headingDark,
    marginBottom: 8,
  },

  fieldError: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },

  // ── Photo placeholder ─────────────────────────────────────────────────────
  photoPlaceholder: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
  },
  photoEmoji: {
    fontSize: 28,
  },
  photoText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textMuted,
  },

  // ── Submit button ─────────────────────────────────────────────────────────
  submitButton: {
    marginTop: 32,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: colors.white,
  },

  // ── Success state ─────────────────────────────────────────────────────────
  successContainer: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  successIcon: {
    fontSize: 64,
  },
  successTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: colors.successText,
    textAlign: 'center',
  },
  successSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  backToMapButton: {
    marginTop: 8,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToMapButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: colors.white,
  },

  bottomPadding: {
    height: 40,
  },
});
