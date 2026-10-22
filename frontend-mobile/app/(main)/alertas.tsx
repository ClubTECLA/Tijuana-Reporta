import React from 'react';
import { router } from 'expo-router';
import { AlertasScreen } from '@/screens/AlertasScreen';

export default function Alertas() {
  return (
    <AlertasScreen
      onBack={() => router.back()}
      onGuardar={() => router.back()}
    />
  );
}