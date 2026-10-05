import { useState } from 'react';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { CandadoIcon } from '@/components/icons/CandadoIcon';
import { CheckCircleIcon } from '@/components/icons/CheckCircleIcon';
import { FlechaUbicacionIcon } from '@/components/icons/FlechaUbicacionIcon';
import { HaloUbicacion } from '@/features/bienvenida/IlustracionMapa';
import { PantallaPermiso } from '@/features/bienvenida/PantallaPermiso';
import { colors } from '@/theme/colors';

// "Activa tu ubicación" (Figma 1): primera pantalla al abrir la app por primera vez.
export default function PermisoUbicacion() {
  const [pidiendo, setPidiendo] = useState(false);

  const permitir = async () => {
    setPidiendo(true);
    try {
      // Se avanza aunque lo niegue: la app funciona sin ubicación y se vuelve a pedir al usarla.
      await Location.requestForegroundPermissionsAsync();
    } catch (err) {
      console.warn('[permisos] no se pudo pedir la ubicación:', err);
    } finally {
      setPidiendo(false);
      router.replace('/permisos/notificaciones');
    }
  };

  return (
    <PantallaPermiso
      paso={0}
      ilustracion={<HaloUbicacion />}
      titulo="Activa tu ubicación"
      descripcion="Así te mostramos lo que pasa cerca de ti y colocamos tu reporte en el lugar correcto."
      puntos={[
        {
          icono: <CheckCircleIcon size={20} color={colors.bienvenidaCheck} />,
          texto: 'Solo la usamos mientras la app está abierta.',
        },
        { icono: <CandadoIcon color={colors.brand} />, texto: 'Otros vecinos no ven tu ubicación exacta.' },
      ]}
      boton={{
        etiqueta: 'Permitir ubicación',
        icono: <FlechaUbicacionIcon />,
        onPress: () => void permitir(),
        cargando: pidiendo,
      }}
    />
  );
}
