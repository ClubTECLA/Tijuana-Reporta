import React from 'react';
import { router } from 'expo-router';
import { PerfilScreen } from '@/screens/PerfilScreen';
import { useSessionStore } from '@/lib/session';

export default function Perfil() {
  // Al limpiar la sesión, app/_layout.tsx saca el mapa del historial y vuelve a la Bienvenida.
  const cerrarSesion = useSessionStore((s) => s.clear);

  return (
    <PerfilScreen
      onBack={() => router.back()}
      onMisReportes={() => router.push('/(main)/mis-reportes')}
      onNotificaciones={() => router.push('/(main)/notificaciones')}
      onAlertas={() => {}} // C22 todavía no existe
      onCerrarSesion={cerrarSesion}
    />
  );
}