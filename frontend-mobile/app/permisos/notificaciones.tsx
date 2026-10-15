import { useState } from 'react';
import { router } from 'expo-router';
import { CampanaIcon } from '@/components/icons/CampanaIcon';
import { CheckCircleIcon } from '@/components/icons/CheckCircleIcon';
import { EscudoIcon } from '@/components/icons/EscudoIcon';
import { AlertaEjemplo } from '@/features/bienvenida/IlustracionMapa';
import { PantallaPermiso } from '@/features/bienvenida/PantallaPermiso';
import { marcarPermisosVistos } from '@/features/bienvenida/permisosVistos';
import { pedirPermisoNotificaciones } from '@/lib/notificaciones';
import { colors } from '@/theme/colors';

// "Recibe alertas cercanas" (Figma 2): segundo y último paso antes de la Bienvenida.
export default function PermisoNotificaciones() {
  const [pidiendo, setPidiendo] = useState(false);

  const activar = async () => {
    setPidiendo(true);
    try {
      // Igual que con la ubicación: si lo niega se sigue, se puede activar después.
      await pedirPermisoNotificaciones();
    } catch (err) {
      console.warn('[permisos] no se pudo pedir el permiso de notificaciones:', err);
    } finally {
      // Si no se puede guardar que ya los vio, igual se avanza: solo volvería a verlos.
      await marcarPermisosVistos().catch((err) =>
        console.warn('[permisos] no se pudo guardar que ya vio los permisos:', err),
      );
      setPidiendo(false);
      router.replace('/');
    }
  };

  return (
    <PantallaPermiso
      paso={1}
      ilustracion={<AlertaEjemplo />}
      titulo="Recibe alertas cercanas"
      descripcion="Te avisamos cuando haya un incidente o un aviso oficial a menos de 1.5 km de ti. Puedes cambiarlo cuando quieras."
      puntos={[
        {
          icono: <CheckCircleIcon size={20} color={colors.bienvenidaCheck} />,
          texto: 'Máximo 10 alertas al día, sin repetir la misma.',
        },
        {
          icono: <EscudoIcon color={colors.etiquetaAdvertenciaText} />,
          texto: 'Los avisos de Protección Civil siempre llegan.',
        },
      ]}
      boton={{
        etiqueta: 'Activar alertas',
        icono: <CampanaIcon />,
        onPress: () => void activar(),
        cargando: pidiendo,
      }}
    />
  );
}
