import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Solo se prueba lógica pura en TS (sin React Native): entorno node y alias `@` -> `src`,
// igual que el `paths` del tsconfig.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
