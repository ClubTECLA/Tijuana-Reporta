import React from 'react';
import { router } from 'expo-router';
import { MisReportesScreen } from '@/screens/MisReportesScreen';

export default function MisReportes() {
  return (
    <MisReportesScreen
      onBack={() => router.back()}
      onSelectReporte={() => router.push('/(main)/detalle-reporte')}
    />
  );
}