import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import {
  createGoogleAuthRequestConfig,
  decodeGoogleIdToken,
  googleDiscovery,
  isGoogleAuthConfigured,
  GoogleProfile,
} from '../services/googleAuth';

type Options = {
  onSuccess: (profile: GoogleProfile) => void;
};

/**
 * Flujo de "Continuar con Google" vía expo-auth-session (funciona en Expo
 * Go, sin dev build). No manda nada a ningún backend todavía — solo
 * autentica contra Google y decodifica el perfil (nombre/correo/foto) del
 * id_token en el cliente.
 */
export function useGoogleSignIn({ onSuccess }: Options) {
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    createGoogleAuthRequestConfig(),
    googleDiscovery
  );
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (response?.type === 'success' && response.params.id_token) {
      const profile = decodeGoogleIdToken(response.params.id_token);
      if (profile) {
        onSuccessRef.current(profile);
      } else {
        Alert.alert('No se pudo leer tu perfil de Google', 'Intenta de nuevo.');
      }
    } else if (response?.type === 'error') {
      Alert.alert('No se pudo iniciar sesión con Google', response.error?.message ?? '');
    }
  }, [response]);

  const signIn = () => {
    if (!isGoogleAuthConfigured) {
      Alert.alert(
        'Google no está configurado',
        'Falta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID en tu .env.local (Client ID de Google Cloud Console).'
      );
      return;
    }
    if (!request) return;
    promptAsync();
  };

  return { signIn, ready: !!request };
}
