import React from 'react';
import { router } from 'expo-router';
import { guardarRadioAlertaKm } from '@/lib/alertasCercanas';
import { AlertasScreen } from '@/screens/AlertasScreen';

export default function Alertas() {
  return (
    <AlertasScreen
      onBack={() => router.back()}
      onGuardar={({ radioKm }) => {
        // Se espera solo la escritura (milisegundos) para que Perfil ya lea el radio nuevo al volver.
        guardarRadioAlertaKm(radioKm)
          .catch((err) => console.warn('[alertas] no se pudo guardar el radio:', err))
          .finally(() => router.back());
      }}
    />
  );
}