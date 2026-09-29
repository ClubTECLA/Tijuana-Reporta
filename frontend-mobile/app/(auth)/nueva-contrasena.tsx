import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AuthScreenShell } from '../../src/components/auth/AuthScreenShell';
import { PasswordField } from '../../src/components/auth/PasswordField';
import { PrimaryButton } from '../../src/components/auth/PrimaryButton';
import { StepDots } from '../../src/components/auth/StepDots';

export default function NuevaContrasenaScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const canSubmit = password.length > 0 && password === confirmPassword;

  return (
    <AuthScreenShell title="Recuperar contraseña">
      <PasswordField label="Nueva contraseña" value={password} onChangeText={setPassword} />
      <PasswordField
        label="Confirmar contraseña"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <PrimaryButton
        label="Confirmar cambios"
        disabled={!canSubmit}
        onPress={() => router.replace('/(auth)/auth?tab=login')}
      />

      <StepDots total={3} current={3} />
    </AuthScreenShell>
  );
}
