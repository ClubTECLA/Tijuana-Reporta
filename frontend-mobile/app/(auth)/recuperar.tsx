import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AuthScreenShell } from '../../src/components/auth/AuthScreenShell';
import { TextField } from '../../src/components/auth/TextField';
import { PrimaryButton } from '../../src/components/auth/PrimaryButton';
import { StepDots } from '../../src/components/auth/StepDots';
import { esCorreoValido } from '../../src/lib/correo';

export default function RecuperarScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  return (
    <AuthScreenShell title="Recuperar contraseña">
      <TextField
        label="Correo electrónico"
        placeholder="tucorreo@ejemplo.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
      />

      <PrimaryButton
        label="Enviar código"
        disabled={!esCorreoValido(email)}
        onPress={() =>
          router.push({ pathname: '/(auth)/verificar', params: { mode: 'recuperar', email: email.trim() } })
        }
      />

      <StepDots total={3} current={1} />
    </AuthScreenShell>
  );
}
