import React from 'react';
import { router } from 'expo-router';
import { MisReportesScreen } from '@/screens/MisReportesScreen';
import { useEsInvitado } from '@/lib/session';
import { useMisReportes } from '@/features/perfil/hooks';

export default function MisReportes() {
  const esInvitado = useEsInvitado();
  const misReportes = useMisReportes();

  return (
    <MisReportesScreen
      activos={misReportes.activos}
      cerrados={misReportes.cerrados}
      cargando={!esInvitado && misReportes.isPending && !misReportes.isPaused}
      sinConexion={!esInvitado && misReportes.isPending && misReportes.isPaused}
      error={!esInvitado && misReportes.isError}
      onReintentar={() => void misReportes.refetch()}
      onBack={() => router.back()}
            onSelectReporte={(r) => router.push({ pathname: '/(main)/detalle-reporte', params: { id: r.id } })}
    />
  );
}