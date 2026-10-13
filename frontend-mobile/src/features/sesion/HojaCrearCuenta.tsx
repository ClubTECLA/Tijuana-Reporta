import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet } from '@/components/BottomSheet';
import { BotonPildora } from '@/components/BotonPildora';
import { UserIcon } from '@/components/icons/UserIcon';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

/** Qué intentó hacer el invitado: cambia el título de la hoja. */
export type MotivoCuenta = 'reportar' | 'comentar' | 'perfil';

const TITULOS: Record<MotivoCuenta, string> = {
  reportar: 'Crea una cuenta para reportar',
  comentar: 'Crea una cuenta para comentar',
  perfil: 'Crea una cuenta para tener tu perfil',
};

interface HojaCrearCuentaProps {
  /** `null` = cerrada. */
  motivo: MotivoCuenta | null;
  onCerrar: () => void;
}

// Aparece cuando el invitado toca algo que requiere cuenta (reportar, comentar, perfil). Sin
// diseño en Figma todavía: sigue el estilo de las hojas y botones existentes.
export function HojaCrearCuenta({ motivo, onCerrar }: HojaCrearCuentaProps) {
  const insets = useSafeAreaInsets();

  const ir = (tab: 'signup' | 'login') => {
    onCerrar();
    router.push(`/(auth)/auth?tab=${tab}`);
  };

  return (
    <BottomSheet isVisible={motivo !== null} onClose={onCerrar}>
      <View style={[styles.contenido, { paddingBottom: Math.max(insets.bottom, 0) + 16 }]}>
        <View style={styles.icono}>
          <UserIcon size={28} color={colors.brand} />
        </View>
        <Text style={styles.titulo} accessibilityRole="header">
          {motivo ? TITULOS[motivo] : ''}
        </Text>
        <Text style={styles.texto}>
          Como invitado puedes ver el mapa y los reportes. Con una cuenta puedes reportar incidentes, comentar y
          confirmar lo que pasa cerca de ti.
        </Text>
        <View style={styles.acciones}>
          <BotonPildora etiqueta="Crear cuenta" onPress={() => ir('signup')} />
          <BotonPildora etiqueta="Ya tengo cuenta" variante="secundario" onPress={() => ir('login')} />
          <BotonPildora etiqueta="Ahora no" variante="texto" onPress={onCerrar} />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  contenido: {
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  icono: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.infoSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    marginTop: 16,
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  texto: {
    marginTop: 8,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  acciones: {
    marginTop: 24,
    alignSelf: 'stretch',
    gap: 12,
  },
});
