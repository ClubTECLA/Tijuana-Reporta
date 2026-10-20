import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Feather } from '@expo/vector-icons';
import { CategoryToggleChip } from '../components/CategoryToggleChip';
import { CATEGORIAS, CategoriaAlerta } from '../types/alertas';
import { perfilColors, perfilRadius } from '../theme/perfilTokens';

const TOP_INSET = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 54;

// Datos de ejemplo: todavía no existe el endpoint de preferencias de alertas en el contrato OpenAPI.
const RADIO_MIN = 0.5;
const RADIO_MAX = 3;

interface AlertasScreenProps {
  onBack?: () => void;
  onGuardar?: (preferencias: { radioKm: number; categorias: CategoriaAlerta[] }) => void;
}

export const AlertasScreen = ({ onBack, onGuardar }: AlertasScreenProps) => {
  const [radioKm, setRadioKm] = useState(1.5);
  const [seleccionadas, setSeleccionadas] = useState<CategoriaAlerta[]>([
    'inundacion',
    'deslave',
    'drenaje',
    'arbol',
    'socavon',
  ]);

  const toggleCategoria = (id: CategoriaAlerta) => {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const guardar = () => onGuardar?.({ radioKm, categorias: seleccionadas });

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>Alertas y lugares</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Avisarme a menos de</Text>
        <Text style={styles.radioValor}>{radioKm.toFixed(1)} km</Text>
        <Slider
          minimumValue={RADIO_MIN}
          maximumValue={RADIO_MAX}
          step={0.1}
          value={radioKm}
          onValueChange={setRadioKm}
          minimumTrackTintColor={perfilColors.primary}
          maximumTrackTintColor={perfilColors.divider}
          thumbTintColor={perfilColors.primary}
        />
        <View style={styles.rangoRow}>
          <Text style={styles.rangoText}>500 m</Text>
          <Text style={styles.rangoText}>3 km</Text>
        </View>

        <Text style={styles.section}>Qué quiero recibir</Text>
        <View style={styles.chipsWrap}>
          {CATEGORIAS.map((cat) => (
            <CategoryToggleChip
              key={cat.id}
              label={cat.label}
              color={cat.color}
              activo={seleccionadas.includes(cat.id)}
              onPress={() => toggleCategoria(cat.id)}
            />
          ))}
        </View>

        <View style={styles.avisoCard}>
          <View style={styles.avisoIconBox}>
            <Feather name="shield" size={18} color="#92400E" />
          </View>
          <View style={styles.avisoTexts}>
            <Text style={styles.avisoTitulo}>Avisos oficiales</Text>
            <Text style={styles.avisoSubtitulo}>Siempre activos por tu seguridad</Text>
          </View>
          <Feather name="lock" size={16} color="#92400E" />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.guardarBtn} onPress={guardar} activeOpacity={0.8}>
          <Feather name="check" size={16} color="#FFFFFF" />
          <Text style={styles.guardarText}>  Guardar cambios</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: perfilColors.screenBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: TOP_INSET + 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  iconButton: {
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
    flex: 1,
    marginLeft: 12,
    fontSize: 22,
    fontWeight: '700',
    color: perfilColors.textPrimary,
  },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  label: { fontSize: 14, color: perfilColors.textPrimary, marginTop: 8 },
  radioValor: { fontSize: 15, fontWeight: '700', color: perfilColors.primary, marginBottom: 4 },
  rangoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  rangoText: { fontSize: 12, color: perfilColors.textSecondary },
  section: {
    fontSize: 12,
    fontWeight: '600',
    color: perfilColors.sectionLabel,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 10,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  avisoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: perfilRadius.card,
    padding: 14,
    marginTop: 24,
  },
  avisoIconBox: {
    width: 36,
    height: 36,
    borderRadius: perfilRadius.icon,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avisoTexts: { flex: 1 },
  avisoTitulo: { fontSize: 14, fontWeight: '600', color: '#78350F' },
  avisoSubtitulo: { fontSize: 12, color: '#92400E', marginTop: 2 },
  footer: { padding: 16, paddingBottom: 24 },
  guardarBtn: {
    flexDirection: 'row',
    backgroundColor: perfilColors.primary,
    borderRadius: perfilRadius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guardarText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});