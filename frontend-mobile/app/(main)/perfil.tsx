import React from 'react';
import { router } from 'expo-router';
import { PerfilScreen } from '@/screens/PerfilScreen';

export default function Perfil() {
  return (
    <PerfilScreen
      onBack={() => router.back()}
      onMisReportes={() => router.push('/(main)/mis-reportes')}
      onNotificaciones={() => router.push('/(main)/notificaciones')}
      onAlertas={() => {}} // C22 todavía no existe
      onCerrarSesion={() => {}}
    />
  );
}