import React from 'react';
import { router } from 'expo-router';
import { NotificacionesScreen } from '@/screens/NotificacionesScreen';

export default function Notificaciones() {
  return <NotificacionesScreen onBack={() => router.back()} />;
}