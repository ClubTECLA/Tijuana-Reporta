import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AuthScreenShell } from '../../src/components/auth/AuthScreenShell';
import { TextField } from '../../src/components/auth/TextField';
import { PrimaryButton } from '../../src/components/auth/PrimaryButton';
import { StepDots } from '../../src/components/auth/StepDots';

export default function RecuperarScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');

  return (
    <AuthScreenShell title="Recuperar contraseña">
      <TextField
        label="Numero de celular"
        placeholder="664-XXX-XXXX"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <PrimaryButton
        label="Enviar codigo"
        disabled={!phone}
        onPress={() =>
          router.push({ pathname: '/(auth)/verificar', params: { mode: 'recuperar', phone } })
        }
      />

      <StepDots total={3} current={1} />
    </AuthScreenShell>
  );
}
