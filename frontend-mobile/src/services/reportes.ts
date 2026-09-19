import { CrearReporteRequest, Reporte } from '../types/api';

const USE_MOCK = true;

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function getAuthToken(): string {
  // In production this will read from expo-secure-store
  return 'mock-token';
}

async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
  const token = getAuthToken();

  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

export async function getReportes(): Promise<Reporte[]> {
  if (USE_MOCK) {
    const { mockReportes } = await import('../mocks/reportes');
    return mockReportes;
  }

  const response = await apiFetch('/api/v1/reportes');
  if (!response.ok) {
    throw new Error(`getReportes failed: ${response.status}`);
  }
  return response.json() as Promise<Reporte[]>;
}

export async function crearReporte(req: CrearReporteRequest): Promise<Reporte> {
  if (USE_MOCK) {
    await new Promise<void>((resolve) => setTimeout(resolve, 800));

    const reporte: Reporte = {
      id: Math.random().toString(36).substring(2),
      titulo: req.titulo,
      categoria: req.categoria,
      tags: req.tags,
      lat: req.lat,
      lng: req.lng,
      status: 'pendiente',
      upvotes: 0,
      user_id: 'mock-user-123',
      created_at: new Date().toISOString(),
      ...(req.direccion !== undefined && { direccion: req.direccion }),
      ...(req.image_base64 !== undefined && { image_url: req.image_base64 }),
    };

    return reporte;
  }

  const response = await apiFetch('/api/v1/reportes', {
    method: 'POST',
    body: JSON.stringify(req),
  });
  if (!response.ok) {
    throw new Error(`crearReporte failed: ${response.status}`);
  }
  return response.json() as Promise<Reporte>;
}

export async function apoyarReporte(id: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
    return;
  }

  const response = await apiFetch(`/api/v1/reportes/${id}/apoyar`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`apoyarReporte failed: ${response.status}`);
  }
}
