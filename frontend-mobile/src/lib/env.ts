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

// Hosts de desarrollo donde se permite http:// (10.0.2.2 es el host visto
// desde el emulador de Android). Cualquier otra API debe ir por https://.
const DEV_HTTP_HOSTS = ['localhost', '127.0.0.1', '10.0.2.2'];

function isValidApiUrl(url: string): boolean {
  if (/^https:\/\/[^\s/]+/.test(url)) return true;
  const http = /^http:\/\/([^\s/:]+)/.exec(url);
  return __DEV__ && !!http && DEV_HTTP_HOSTS.includes(http[1]);
}

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
const useMocks = parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS);

if (!useMocks && !isValidApiUrl(apiUrl)) {
  throw new Error(
    'EXPO_PUBLIC_USE_MOCKS=false requiere EXPO_PUBLIC_API_URL con una URL https:// ' +
      `(http:// solo en desarrollo y solo para ${DEV_HTTP_HOSTS.join(', ')}). Recibido: "${apiUrl}".`
  );
}

export const env = {
  apiUrl,
  useMocks,
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
} as const;
