// Expo solo incrusta EXPO_PUBLIC_* si se leen literalmente como
// `process.env.EXPO_PUBLIC_X` (sin desestructurar ni acceso dinámico), y el
// valor se fija al armar el bundle: si cambias uno, reinicia Metro con `-c`.
export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
  // Mocks activos salvo que se declare EXPO_PUBLIC_USE_MOCKS=false.
  useMocks: process.env.EXPO_PUBLIC_USE_MOCKS !== 'false',
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
} as const;
