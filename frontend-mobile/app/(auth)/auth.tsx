import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthScreenShell } from '../../src/components/auth/AuthScreenShell';
import { AuthTabs, AuthTab } from '../../src/components/auth/AuthTabs';
import { TextField } from '../../src/components/auth/TextField';
import { PasswordField } from '../../src/components/auth/PasswordField';
import { PrimaryButton } from '../../src/components/auth/PrimaryButton';
import { GoogleButton } from '../../src/components/auth/GoogleButton';
import { TermsCheckbox } from '../../src/components/auth/TermsCheckbox';
import { useGoogleSignIn } from '../../src/hooks/useGoogleSignIn';
import { colors } from '../../src/theme/colors';
import { fontFamily } from '../../src/theme/typography';

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<AuthTab>(params.tab === 'login' ? 'login' : 'signup');

  const { signIn: signInWithGoogle } = useGoogleSignIn({
    onSuccess: (profile) => {
      Alert.alert(
        'Sesión iniciada con Google',
        `Bienvenido${profile.name ? `, ${profile.name}` : ''}${profile.email ? `\n${profile.email}` : ''}`,
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    },
  });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const canSubmitSignup = name && phone && password && confirmPassword && acceptedTerms;
  const canSubmitLogin = phone && password;

  return (
    <AuthScreenShell title={tab === 'signup' ? 'Crear cuenta' : 'Iniciar Sesion'}>
      <AuthTabs value={tab} onChange={setTab} />

      {tab === 'signup' ? (
        <>
          <TextField
            label="Nombre completo"
            placeholder="Alex Ramírez"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextField
            label="Numero de celular"
            placeholder="664-XXX-XXXX"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <PasswordField label="Contraseña" value={password} onChangeText={setPassword} />
          <PasswordField
            label="Confirmar contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TermsCheckbox checked={acceptedTerms} onChange={setAcceptedTerms} />

          <PrimaryButton
            label="Registrarse"
            disabled={!canSubmitSignup}
            onPress={() =>
              router.push({ pathname: '/(auth)/verificar', params: { mode: 'registro', phone } })
            }
          />
        </>
      ) : (
        <>
          <TextField
            label="Numero de celular"
            placeholder="664-XXX-XXXX"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <PasswordField label="Contraseña" value={password} onChangeText={setPassword} />

          <View style={styles.loginLinksRow}>
            <Pressable style={styles.rememberRow} onPress={() => setRememberMe((v) => !v)}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]} />
              <Text style={styles.rememberLabel}>Recordarme</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(auth)/recuperar')}>
              <Text style={styles.forgotLabel}>¿Olvidaste la contraseña?</Text>
            </Pressable>
          </View>

          <PrimaryButton
            label="Iniciar sesion"
            showArrow={false}
            disabled={!canSubmitLogin}
            onPress={() => {}}
          />
        </>
      )}

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>O</Text>
        <View style={styles.dividerLine} />
      </View>

      <GoogleButton onPress={signInWithGoogle} />
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  loginLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.checkboxBorder,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rememberLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  forgotLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.link,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.inputBorder,
  },
  dividerLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
});
