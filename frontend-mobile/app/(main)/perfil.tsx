import React from 'react';
import { router } from 'expo-router';
import { PerfilScreen } from '@/screens/PerfilScreen';
import { queryClient } from '@/lib/query-client';
import { useEsInvitado, useSessionStore } from '@/lib/session';
import { perfilKeys, useMiPerfil } from '@/features/perfil/hooks';
import { nombreVisible } from '@/features/perfil/nombre';

export default function Perfil() {
  // Al limpiar la sesión, app/_layout.tsx saca el mapa del historial y vuelve a la Bienvenida.
  const limpiarSesion = useSessionStore((s) => s.clear);
  const esInvitado = useEsInvitado();
  const perfil = useMiPerfil();

  const cerrarSesion = () => {
    // Sin esto, el siguiente usuario vería un instante el perfil del anterior.
    queryClient.removeQueries({ queryKey: perfilKeys.me });
    limpiarSesion();
  };

  return (
    <PerfilScreen
      nombre={esInvitado ? 'Invitado' : perfil.data ? nombreVisible(perfil.data.username) : ''}
      correo={esInvitado ? undefined : perfil.data?.email}
      cargando={!esInvitado && perfil.isPending}
      error={!esInvitado && perfil.isError}
      onReintentar={() => void perfil.refetch()}
      onBack={() => router.back()}
      onMisReportes={() => router.push('/(main)/mis-reportes')}
      onNotificaciones={() => router.push('/(main)/notificaciones')}
      onAlertas={() => router.push('/(main)/alertas')}
      onCerrarSesion={cerrarSesion}
    />
  );
}