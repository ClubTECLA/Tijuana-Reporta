// Navegador para probar flujo
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PerfilScreen } from './src/screens/PerfilScreen';
import { MisReportesScreen } from './src/screens/MisReportesScreen';
import { NotificacionesScreen } from './src/screens/NotificacionesScreen';

type Pantalla = 'perfil' | 'misReportes' | 'notificaciones';

export default function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('perfil');

  return (
    <>
      {pantalla === 'perfil' && (
        <PerfilScreen
          onMisReportes={() => setPantalla('misReportes')}
          onNotificaciones={() => setPantalla('notificaciones')}
          onAlertas={() => {}}   // C22 todavía no existe
          onCerrarSesion={() => {}}
        />
      )}

      {pantalla === 'misReportes' && (
        <MisReportesScreen onBack={() => setPantalla('perfil')} />
      )}

      {pantalla === 'notificaciones' && (
        <NotificacionesScreen onBack={() => setPantalla('perfil')} />
      )}

      <StatusBar style="dark" />
    </>
  );
}