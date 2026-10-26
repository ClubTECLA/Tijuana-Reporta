interface OpcionesLoginDev {
  apiUrl: string;
  email: string;
  password: string;
  fetchFn?: typeof fetch;
}

/** POST /auth/login con las credenciales de desarrollo. `null` si falla: en dev nunca debe tumbar el arranque. */
export async function obtenerTokenDev({
  apiUrl,
  email,
  password,
  fetchFn = fetch,
}: OpcionesLoginDev): Promise<string | null> {
  try {
    const response = await fetchFn(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) return null;
    const cuerpo = (await response.json()) as { access_token?: string };
    return cuerpo.access_token ?? null;
  } catch {
    return null;
  }
}
