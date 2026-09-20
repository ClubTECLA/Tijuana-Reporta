import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';
import { Reporte, CategoriaReporte, StatusReporte } from '../types/api';
import { BottomSheet } from './BottomSheet';

// ── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIA_LABELS: Record<CategoriaReporte, string> = {
  socavon: 'Socavón',
  peligro: 'Peligro',
  drenaje: 'Drenaje',
  luz: 'Luz',
  deslave: 'Deslave',
  arbol: 'Árbol / Poste',
  inundacion: 'Inundación',
  servicios: 'Servicios',
  otro: 'Otro',
};

const CATEGORIA_EMOJI: Record<CategoriaReporte, string> = {
  socavon: '🕳️',
  peligro: '⚠️',
  drenaje: '🌀',
  luz: '💡',
  deslave: '⛰️',
  arbol: '🌳',
  inundacion: '🌊',
  servicios: '🔧',
  otro: '📍',
};

const STATUS_CONFIG: Record<StatusReporte, { label: string; bg: string; text: string }> = {
  pendiente: { label: 'Pendiente', bg: '#fff7ed', text: colors.statusPendiente },
  en_proceso: { label: 'En proceso', bg: '#eff6ff', text: colors.statusEnProceso },
  resuelto: { label: 'Resuelto', bg: colors.successLight, text: colors.successText },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  return `Hace ${Math.floor(hrs / 24)} días`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface IncidentCardProps {
  reporte: Reporte | null;
  onClose: () => void;
  onApoyar?: (id: string) => void;
  onVerDetalle?: (id: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function IncidentCard({
  reporte,
  onClose,
  onApoyar,
  onVerDetalle,
}: IncidentCardProps) {
  if (!reporte) return null;

  const statusCfg = STATUS_CONFIG[reporte.status];

  return (
    <BottomSheet isVisible={!!reporte} onClose={onClose} maxHeightRatio={0.7}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Imagen */}
        {reporte.image_url ? (
          <Image
            source={{ uri: reporte.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderEmoji}>
              {CATEGORIA_EMOJI[reporte.categoria]}
            </Text>
          </View>
        )}

        {/* Badges: categoría + status */}
        <View style={styles.badgeRow}>
          <View style={styles.categoriaBadge}>
            <Text style={styles.categoriaEmoji}>{CATEGORIA_EMOJI[reporte.categoria]}</Text>
            <Text style={styles.categoriaText}>{CATEGORIA_LABELS[reporte.categoria]}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.text }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        {/* Título */}
        <Text style={styles.titulo}>{reporte.titulo}</Text>

        {/* Dirección + tiempo */}
        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>📍</Text>
          <Text style={styles.metaText} numberOfLines={1}>
            {reporte.direccion ?? `${reporte.lat.toFixed(4)}, ${reporte.lng.toFixed(4)}`}
          </Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaTime}>{timeAgo(reporte.created_at)}</Text>
        </View>

        {/* Tags */}
        {reporte.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {reporte.tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Separador */}
        <View style={styles.divider} />

        {/* Acciones - Botones de ocurrencia */}
        <View style={styles.actions}>
          <Pressable
            style={styles.btnYaNoOcurre}
            onPress={() => {
              // TODO: action for 'No está ahí'
              onClose();
            }}
          >
            <Text style={styles.btnYaNoOcurreText}>No está ahí</Text>
          </Pressable>

          <Pressable
            style={styles.btnOcurre}
            onPress={() => {
              // TODO: action for 'Sigue ocurriendo'
              onApoyar?.(reporte.id);
            }}
          >
            <Text style={styles.btnOcurreText}>Sigue ocurriendo</Text>
          </Pressable>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },

  // Image
  image: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 14,
  },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 14,
  },
  imagePlaceholderEmoji: {
    fontSize: 40,
  },

  // Badges
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  categoriaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  categoriaEmoji: {
    fontSize: 14,
  },
  categoriaText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.headingDark,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
  },

  // Título
  titulo: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.headingDark,
    marginBottom: 8,
    lineHeight: 26,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  metaIcon: {
    fontSize: 13,
  },
  metaText: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
  },
  metaDot: {
    color: colors.textMuted,
    fontSize: 13,
  },
  metaTime: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textMuted,
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textMuted,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.surfaceHover,
    marginVertical: 14,
  },

  // Acciones (Botones-de-ocurrencia)
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  btnYaNoOcurre: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  btnYaNoOcurreText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.textMuted,
  },
  btnOcurre: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  btnOcurreText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.white,
  },
});
