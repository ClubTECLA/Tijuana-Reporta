import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import * as Location from 'expo-location';
import * as MapLibreGL from '@maplibre/maplibre-react-native';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';

// Configure maplibre to use the style

interface UbicacionPickerProps {
  lat: number | null;
  lng: number | null;
  address: string | null;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

export const UbicacionPicker = ({
  lat,
  lng,
  address,
  onLocationChange,
}: UbicacionPickerProps) => {
  const [loading, setLoading] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const hasLocation = lat !== null && lng !== null;

  const handleDetect = async () => {
    setLoading(true);
    setPermissionError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionError('Permiso de ubicación denegado. Actívalo en Configuración.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;

      let formattedAddress = 'Ubicación detectada';
      try {
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (results.length > 0) {
          const r = results[0];
          const parts = [r.street, r.streetNumber].filter(Boolean);
          const streetLine = parts.length > 0 ? parts.join(' ') : null;
          const city = r.city ?? r.region ?? null;
          if (streetLine && city) {
            formattedAddress = `${streetLine}, ${city}`;
          } else if (streetLine) {
            formattedAddress = streetLine;
          } else if (city) {
            formattedAddress = city;
          }
        }
      } catch {
        // reverseGeocode failed — keep default string
      }

      onLocationChange(latitude, longitude, formattedAddress);
    } catch {
      setPermissionError('No se pudo obtener la ubicación. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {!hasLocation ? (
        <View style={styles.idleRow}>
          <Text style={styles.pinIcon}>📍</Text>
          <View style={styles.idleText}>
            <Text style={styles.idleTitle}>Usar mi ubicación actual</Text>
            <Text style={styles.idleSubtitle}>
              Usaremos tu ubicación exacta para el reporte
            </Text>
            {!!permissionError && (
              <Text style={styles.errorText}>{permissionError}</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleDetect}
            disabled={loading}
            activeOpacity={0.75}
            style={styles.detectButton}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.detectButtonText}>Detectar</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.capturedContainer}>
          <View style={styles.mapContainer}>
            <MapLibreGL.Map
              key={`${lat}-${lng}`}
              style={StyleSheet.absoluteFill}
              mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
              touchPitch={false}
              dragPan={false}
              touchZoom={false}
              doubleTapZoom={false}
              doubleTapHoldZoom={false}
              touchRotate={false}
              compass={false}
              logo={false}
              attribution={false}
            >
              <MapLibreGL.Camera initialViewState={{ center: [lng!, lat!], zoom: 15 }} />
              <MapLibreGL.Marker id="picked-location" lngLat={[lng!, lat!]}>
                <View style={styles.annotationContainer}>
                  <Text style={styles.annotationPin}>📍</Text>
                </View>
              </MapLibreGL.Marker>
            </MapLibreGL.Map>
          </View>

          <View style={styles.capturedRow}>
            <Text style={styles.pinIcon}>📍</Text>
            <View style={styles.capturedText}>
              <Text style={styles.addressText} numberOfLines={2}>
                {address ?? 'Ubicación detectada'}
              </Text>
              <Text style={styles.coordsText}>
                {lat!.toFixed(6)}, {lng!.toFixed(6)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleDetect}
              disabled={loading}
              activeOpacity={0.75}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.changeLink}>Cambiar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.surfaceHover,
    padding: 16,
  },
  idleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pinIcon: {
    fontSize: 22,
  },
  idleText: {
    flex: 1,
    gap: 2,
  },
  idleTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.headingDark,
  },
  idleSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  detectButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
  },
  detectButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.white,
  },
  capturedContainer: {
    gap: 12,
  },
  mapContainer: {
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surfaceHover,
  },
  annotationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  annotationPin: {
    fontSize: 24,
  },
  capturedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  capturedText: {
    flex: 1,
    gap: 2,
  },
  addressText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.headingDark,
  },
  coordsText: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  changeLink: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.primary,
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.danger,
    marginTop: 2,
  },
});
