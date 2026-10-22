import React from 'react';
import { router } from 'expo-router';
import { DetalleReporteScreen } from '@/screens/DetalleReporteScreen';

export default function DetalleReporte() {
  return (
    <DetalleReporteScreen
      onBack={() => router.back()}
      onShare={() => {}}
      onEliminar={() => {}}
    />
  );
}