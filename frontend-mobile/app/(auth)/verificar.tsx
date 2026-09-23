import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AuthScreenShell } from '../../src/components/auth/AuthScreenShell';
import { OtpInput } from '../../src/components/auth/OtpInput';
import { PrimaryButton } from '../../src/components/auth/PrimaryButton';
import { StepDots } from '../../src/components/auth/StepDots';
import { colors } from '../../src/theme/colors';
import { fontFamily } from '../../src/theme/typography';

const OTP_SECONDS = 4 * 60 + 38;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function VerificarScreen() {
  const router = useRouter();
  const { mode, phone } = useLocalSearchParams<{ mode?: string; phone?: string }>();
  const isRecuperar = mode === 'recuperar';

  const [code, setCode] = useState<string[]>(['', '', '', '']);
  const [secondsLeft, setSecondsLeft] = useState(OTP_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const canVerify = code.every((digit) => /^[0-9]$/.test(digit));

  const handleVerify = () => {
    if (isRecuperar) {
      router.push({ pathname: '/(auth)/nueva-contrasena', params: { phone } });
    } else {
      router.replace('/');
    }
  };

  return (
    <AuthScreenShell title={isRecuperar ? 'Ingresa el código' : 'Crear cuenta'}>
      {isRecuperar && <StepDots total={3} current={2} />}

      <Text style={styles.subtitle}>Escribe el código de 4 dígitos</Text>

      <Text style={styles.sentTo}>
        <Text style={styles.sentToMuted}>Código enviado a </Text>
        {phone ? `+52 ${phone}` : '+52 664-XXX-XXXX'}
      </Text>

      <OtpInput value={code} onChange={setCode} />

      <View style={styles.metaRow}>
        <Text style={styles.expiresLabel}>
          <Text style={styles.sentToMuted}>Vence en: </Text>
          {formatTime(secondsLeft)}
        </Text>
        <Text style={styles.resendLabel}>Reenviar SMS</Text>
      </View>

      <Text style={styles.attemptsLabel}>
        Tienes 3 intentos. Después hay que esperar 15 minutos para pedir otro código
      </Text>

      <PrimaryButton label="Verificar" disabled={!canVerify} onPress={handleVerify} />
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 19,
    color: colors.black,
    marginTop: -4,
  },
  sentTo: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.black,
  },
  sentToMuted: {
    color: colors.textMutedSoft,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiresLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.black,
  },
  resendLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.primaryLight,
  },
  attemptsLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: colors.textMutedSoft,
    textAlign: 'center',
  },
});
