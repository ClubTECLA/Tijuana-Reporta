import * as AuthSession from 'expo-auth-session';
import { env } from '@/lib/env';

/**
 * Web Client ID de Google Cloud Console (tipo "Web application"), necesario
 * para el login con Google vía Expo Go. Configúralo en .env.local:
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxxx.apps.googleusercontent.com
 */
export const GOOGLE_WEB_CLIENT_ID = env.googleWebClientId;

export const isGoogleAuthConfigured = GOOGLE_WEB_CLIENT_ID.length > 0;

export const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export type GoogleProfile = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
};

/**
 * Decodifica el payload de un id_token (JWT) sin verificar la firma — solo
 * para leer nombre/correo/foto en el cliente. La verificación real (si algún
 * día se manda al backend) debe hacerse en el servidor, nunca solo aquí.
 */
export function decodeGoogleIdToken(idToken: string): GoogleProfile | null {
  try {
    const payload = idToken.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    // atob() da una string "binaria" (un char = un byte) — hay que pasarla a
    // bytes reales y decodificarla como UTF-8, si no los nombres con acentos
    // u otros caracteres no-ASCII salen corruptos.
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder('utf-8').decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function createGoogleAuthRequestConfig(): AuthSession.AuthRequestConfig {
  return {
    clientId: GOOGLE_WEB_CLIENT_ID,
    redirectUri: AuthSession.makeRedirectUri(),
    scopes: ['openid', 'profile', 'email'],
    responseType: AuthSession.ResponseType.IdToken,
    usePKCE: false,
    extraParams: {
      nonce: Math.random().toString(36).slice(2),
    },
  };
}
