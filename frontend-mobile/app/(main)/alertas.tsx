import React from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { guardarRadioAlertaKm } from '@/lib/alertasCercanas';
import { AlertasScreen } from '@/screens/AlertasScreen';

export default function Alertas() {
  return (
    <AlertasScreen
      onBack={() => router.back()}
      onGuardar={({ radioKm }) => {
        // Se espera solo la escritura (milisegundos) para que Perfil ya lea el radio nuevo al volver.
        // Si falla, la pantalla sigue abierta para que el usuario lo intente de nuevo.
        guardarRadioAlertaKm(radioKm)
          .then(() => router.back())
          .catch((err) => {
            console.warn('[alertas] no se pudo guardar el radio:', err);
            Alert.alert('No se pudo guardar', 'Intenta de nuevo en un momento.');
          });
      }}
    />
  );
}