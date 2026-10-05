import { Stack } from 'expo-router';
import { useEsInvitado } from '@/lib/session';

export default function MainLayout() {
  const esInvitado = useEsInvitado();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="buscar" />
      {/* El invitado solo ve el mapa, los reportes y su detalle: si llega a estas rutas
          (p. ej. por un enlace) expo-router lo regresa al mapa. */}
      <Stack.Protected guard={!esInvitado}>
        {/* La hoja "Reportar un incidente" se dibuja sobre el mapa, que sigue visible detrás. */}
        <Stack.Screen
          name="crear-reporte"
          options={{ presentation: 'transparentModal', animation: 'fade' }}
        />
        <Stack.Screen name="perfil" />
        <Stack.Screen name="mis-reportes" />
        <Stack.Screen name="notificaciones" />
      </Stack.Protected>
    </Stack>
  );
}
