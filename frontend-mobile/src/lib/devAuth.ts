import { env } from './env';
import { obtenerTokenDev } from './devLogin';
import { useSessionStore } from './session';

// Solo desarrollo: con EXPO_PUBLIC_USE_MOCKS=false y EXPO_PUBLIC_DEV_EMAIL/PASSWORD (en .env.local,
// que no se commitea) inicia sesión sola al arrancar para poder probar contra el backend real
// mientras no exista la pantalla de login conectada. Se quita cuando el login real esté listo.
// Cualquier 401 posterior sigue el manejo normal de `http`.
export async function iniciarSesionDev(): Promise<void> {
  const email = process.env.EXPO_PUBLIC_DEV_EMAIL;
  const password = process.env.EXPO_PUBLIC_DEV_PASSWORD;
  if (!__DEV__ || env.useMocks || !email || !password) return;

  const token = await obtenerTokenDev({ apiUrl: env.apiUrl, email, password });
  if (token) useSessionStore.getState().iniciarSesion(token);
}
