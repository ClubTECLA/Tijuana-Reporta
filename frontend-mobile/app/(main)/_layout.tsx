import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* La hoja "Reportar un incidente" se dibuja sobre el mapa, que sigue visible detrás. */}
      <Stack.Screen
        name="crear-reporte"
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
    </Stack>
  );
}
