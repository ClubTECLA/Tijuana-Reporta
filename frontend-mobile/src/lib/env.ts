// Expo solo incrusta EXPO_PUBLIC_* si se leen literalmente como
// `process.env.EXPO_PUBLIC_X` (sin desestructurar ni acceso dinámico), y el
// valor se fija al armar el bundle: si cambias uno, reinicia Metro con `-c`.

// Mocks activos salvo que se declare explícitamente EXPO_PUBLIC_USE_MOCKS=false.
function parseUseMocks(raw: string | undefined): boolean {
  if (raw === undefined || raw === '' || raw === 'true') return true;
  if (raw === 'false') return false;
  throw new Error(
    `EXPO_PUBLIC_USE_MOCKS debe ser "true" o "false" (recibido: "${raw}").`
  );
}

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
const useMocks = parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS);

if (!useMocks && !/^https?:\/\/\S+$/.test(apiUrl)) {
  throw new Error(
    'EXPO_PUBLIC_USE_MOCKS=false requiere EXPO_PUBLIC_API_URL con una URL http(s) válida ' +
      `(recibido: "${apiUrl}").`
  );
}

export const env = {
  apiUrl,
  useMocks,
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
} as const;
