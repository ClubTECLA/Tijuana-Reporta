import React from 'react';
import { Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { DetalleReporteScreen, type DetalleVista } from '@/screens/DetalleReporteScreen';
import { env } from '@/lib/env';
import { ApiError } from '@/lib/http';
import { hace } from '@/lib/time';
import { useEsInvitado } from '@/lib/session';
import { urlMultimedia } from '@/features/reportes/mappers';
import { mapearEstadoMio } from '@/features/perfil/misReportes';
import { pasosDeSeguimiento } from '@/features/perfil/detalle';
import { useDetalleMiReporte } from '@/features/perfil/hooks';

export default function DetalleReporte() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const esInvitado = useEsInvitado();
  const detalle = useDetalleMiReporte(id);
  const r = detalle.data;

  const sinId = id === undefined;
  const noEncontrado = sinId || (detalle.error instanceof ApiError && detalle.error.status === 404);

  const vista: DetalleVista | undefined = r
    ? {
        titulo: r.titulo,
        direccion: r.direccion,
        estado: mapearEstadoMio(r.estado_actual),
        enviado: `Enviado ${hace(r.created_at).toLowerCase()}`,
        confirmaciones: r.avistamientos,
        fotoUrl: r.multimedia[0] ? urlMultimedia(r.multimedia[0].path, env.apiUrl) : undefined,
        pasos: pasosDeSeguimiento(r.estado_actual, r.created_at, r.updated_at, hace),
      }
    : undefined;

  const compartir = () => {
    if (!r) return;
    void Share.share({ message: r.direccion ? `${r.titulo}\n${r.direccion}` : r.titulo });
  };

  return (
    <DetalleReporteScreen
      reporte={vista}
      cargando={!sinId && !esInvitado && detalle.isPending && !detalle.isPaused}
      sinConexion={!sinId && !esInvitado && detalle.isPending && detalle.isPaused}
      error={!sinId && !esInvitado && detalle.isError && !noEncontrado}
      noEncontrado={noEncontrado}
      onReintentar={() => void detalle.refetch()}
      onBack={() => router.back()}
      onShare={compartir}
    />
  );
}