import { onlineManager } from '@tanstack/react-query';
import { ErrorRed } from '@/lib/http';
import type { ComentarioConAutor, Reporte } from '@/types/api';
import type { IncidenteApi } from './mappers';
import type { ReportesApi } from './port';

// Simula la latencia y, sin conexión, falla como lo haría `http` (ErrorRed): así los estados
// de "sin conexión" se pueden probar con mocks apagando el wifi/datos del dispositivo.
const delay = async (ms: number) => {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
  if (!onlineManager.isOnline()) throw new ErrorRed();
};

const seed: Reporte[] = [
  {
    id: 'b75f858a-36fb-4c12-8789-58bfa98d248b',
    titulo: 'Socavón en Blvd. Agua Caliente',
    categorias: ['socavon'],
    tags: ['profundo', 'peligro'],
    lat: 32.5149,
    lng: -117.0094,
    direccion: 'Blvd. Agua Caliente, 22000 Tijuana, B.C.',
    image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80',
    status: 'en_proceso',
    upvotes: 45,
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // hace 2 horas
  },
  {
    id: 'f9b8c7d6-e5f4-3a2b-1c0d-9e8f7a6b5c4d',
    titulo: 'Árbol caído sobre cableado',
    categorias: ['arbol'],
    tags: ['cables', 'bloqueo'],
    lat: 32.5255,
    lng: -117.0210,
    direccion: 'Paseo de los Héroes, Zona Río, 22010',
    image_url: 'https://images.unsplash.com/photo-1596489370605-7f938d821360?auto=format&fit=crop&q=80',
    status: 'pendiente',
    upvotes: 12,
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // hace 30 mins
  },
  {
    id: 'a1b2c3d4-e5f6-4a5b-6c7d-8e9f0a1b2c3d',
    titulo: 'Inundación severa en Vía Rápida',
    categorias: ['inundacion'],
    tags: ['tráfico', 'imposible_pasar'],
    lat: 32.5312,
    lng: -116.9934,
    direccion: 'Vía Rápida Poniente, 3ra Etapa del Río',
    image_url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&q=80',
    status: 'pendiente',
    upvotes: 108,
    user_id: '123e4567-e89b-12d3-a456-426614174002',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // hace 1 día
  },
  {
    id: 'c3d4e5f6-a1b2-4c5d-6e7f-8a9b0c1d2e3f',
    titulo: 'Falla eléctrica en toda la colonia',
    categorias: ['luz'],
    tags: ['sin_luz', 'apagón'],
    lat: 32.4831,
    lng: -116.9664,
    direccion: 'La Presa, 22226 Tijuana, B.C.',
    status: 'resuelto',
    upvotes: 22,
    user_id: '123e4567-e89b-12d3-a456-426614174003',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // hace 2 días
  },
  // Casos para probar "Capas y filtros": cubren drenaje y deslave (sin ellos esos chips no cambian
  // nada), reportes con varias categorías, categorías fuera del picker y cada ventana de período.
  {
    id: '5d1f2c3e-1a2b-4c3d-8e4f-0a1b2c3d4e51',
    titulo: 'Drenaje colapsado en Col. Libertad',
    categorias: ['drenaje'],
    tags: ['aguas_negras', 'mal_olor'],
    lat: 32.5345,
    lng: -117.005,
    direccion: 'Col. Libertad, 22300 Tijuana, B.C.',
    status: 'pendiente',
    upvotes: 9,
    user_id: '123e4567-e89b-12d3-a456-426614174004',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // hace 45 min (Ahora)
  },
  {
    id: '6e2a3d4f-2b3c-4d4e-9f50-1b2c3d4e5f62',
    titulo: 'Deslave sobre camino en Camino Verde',
    categorias: ['deslave'],
    tags: ['tierra', 'camino_bloqueado'],
    lat: 32.4905,
    lng: -116.982,
    direccion: 'Camino Verde, 22205 Tijuana, B.C.',
    status: 'en_proceso',
    upvotes: 31,
    user_id: '123e4567-e89b-12d3-a456-426614174005',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // hace 5 horas (24 h)
  },
  {
    id: '7f3b4e50-3c4d-4e5f-a061-2c3d4e5f6073',
    titulo: 'Drenaje tapado e inundación en Zona Río',
    categorias: ['drenaje', 'inundacion'], // varias categorías: coincide si cualquiera está activa
    tags: ['coladera', 'charco'],
    lat: 32.5231,
    lng: -117.009,
    direccion: 'Zona Río, 22010 Tijuana, B.C.',
    status: 'pendiente',
    upvotes: 17,
    user_id: '123e4567-e89b-12d3-a456-426614174006',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // hace 3 días (7 días)
  },
  {
    id: '8a4c5f61-4d5e-4f60-b172-3d4e5f607184',
    titulo: 'Deslave en acantilado de Playas de Tijuana',
    categorias: ['deslave'],
    tags: ['acantilado', 'riesgo'],
    lat: 32.529,
    lng: -117.1235,
    direccion: 'Playas de Tijuana, 22500 Tijuana, B.C.',
    status: 'resuelto',
    upvotes: 6,
    user_id: '123e4567-e89b-12d3-a456-426614174007',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(), // hace 6 días (7 días)
  },
  {
    id: '9b5d6072-5e6f-4071-8283-4e5f60718295',
    titulo: 'Cables sueltos en Av. Revolución',
    categorias: ['peligro'], // fuera del picker: solo se ve con las 6 categorías activas
    tags: ['cables', 'peligro'],
    lat: 32.5322,
    lng: -117.0378,
    direccion: 'Av. Revolución, Zona Centro, 22000',
    status: 'pendiente',
    upvotes: 24,
    user_id: '123e4567-e89b-12d3-a456-426614174008',
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // hace 1 hora (Ahora)
  },
  {
    id: 'ac6e7183-6f70-4182-9394-5f60718293a6',
    titulo: 'Falta de agua en Otay Centenario',
    categorias: ['servicios'], // fuera del picker y más viejo que 7 días: ningún período lo muestra
    tags: ['sin_agua'],
    lat: 32.5442,
    lng: -116.9618,
    direccion: 'Otay Centenario, 22430 Tijuana, B.C.',
    status: 'en_proceso',
    upvotes: 52,
    user_id: '123e4567-e89b-12d3-a456-426614174009',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // hace 10 días (fuera de todo)
  },
  {
    id: 'bd7f8294-7081-4293-a4a5-60718293a4b7',
    titulo: 'Socavón y luminaria apagada en Blvd. Díaz Ordaz',
    categorias: ['socavon', 'luz'], // varias categorías
    tags: ['bache_profundo', 'sin_luz'],
    lat: 32.5071,
    lng: -117.0148,
    direccion: 'Blvd. Díaz Ordaz, 22044 Tijuana, B.C.',
    status: 'pendiente',
    upvotes: 14,
    user_id: '123e4567-e89b-12d3-a456-426614174010',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), // hace 20 horas (24 h)
  },
  {
    id: 'ce8093a5-8192-43a4-b5b6-718293a4b5c8',
    titulo: 'Basura acumulada en Mesa de Otay',
    categorias: ['otro'], // fuera del picker
    tags: ['basura'],
    lat: 32.546,
    lng: -116.942,
    direccion: 'Mesa de Otay, 22457 Tijuana, B.C.',
    status: 'pendiente',
    upvotes: 3,
    user_id: '123e4567-e89b-12d3-a456-426614174011',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // hace 12 horas (24 h)
  },
];

/** Genera una fecha ISO anterior al momento actual por la cantidad de minutos indicada. */
const haceMin = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

// Hilos de ejemplo (Figma 22: "Inundación en Zona Centro"), por id de reporte.
const seedComentarios: Record<string, ComentarioConAutor[]> = {
  'a1b2c3d4-e5f6-4a5b-6c7d-8e9f0a1b2c3d': [
    {
      id: 1,
      reporte_id: 'a1b2c3d4-e5f6-4a5b-6c7d-8e9f0a1b2c3d',
      user_id: 'mock-rescatista-1',
      autor: 'José M.',
      es_rescatista: true,
      comentario: 'Ya se está haciendo revisión de este incidente',
      created_at: haceMin(240),
    },
    {
      id: 2,
      reporte_id: 'a1b2c3d4-e5f6-4a5b-6c7d-8e9f0a1b2c3d',
      user_id: 'mock-user-luis',
      autor: 'Luis R.',
      comentario: 'Se metió el agua a dos locales. Con El Niño esto se pone peor cada lluvia.',
      created_at: haceMin(120),
    },
    {
      id: 3,
      reporte_id: 'a1b2c3d4-e5f6-4a5b-6c7d-8e9f0a1b2c3d',
      user_id: 'mock-user-anonimo',
      autor: 'Anónimo',
      comentario: 'El nivel sigue subiendo, no baja porque las coladeras están tapadas.',
      created_at: haceMin(180),
    },
    {
      id: 4,
      reporte_id: 'a1b2c3d4-e5f6-4a5b-6c7d-8e9f0a1b2c3d',
      user_id: 'mock-user-paola',
      autor: 'Paola M.',
      comentario: 'Tercer día seguido que se inunda este cruce.',
      created_at: haceMin(240),
    },
  ],
  'b75f858a-36fb-4c12-8789-58bfa98d248b': [
    {
      id: 5,
      reporte_id: 'b75f858a-36fb-4c12-8789-58bfa98d248b',
      user_id: 'mock-user-luis',
      autor: 'Luis R.',
      comentario: 'Ya le cayeron dos coches, cuidado si vienen de noche.',
      created_at: haceMin(90),
    },
  ],
};

// Estado en memoria: lo que se crea o se apoya durante la sesión se refleja
// en la siguiente lectura, para poder probar el flujo completo sin backend.
let reportes = [...seed];
const comentariosPorReporte = new Map<string, ComentarioConAutor[]>(Object.entries(seedComentarios));
let siguienteComentarioId = 100;

// Mismo catálogo que el backend (slugs, etiquetas y colores) para que mock y real se vean igual.
const incidentes: IncidenteApi[] = [
  ['luz', 'Luz', '#F5C518'],
  ['socavon', 'Socavón', '#8D6E63'],
  ['arbol', 'Árbol', '#2E7D32'],
  ['drenaje', 'Drenaje', '#00897B'],
  ['deslave', 'Deslave', '#E65100'],
  ['inundacion', 'Inundación', '#1E88E5'],
  ['incendio', 'Incendio', '#D32F2F'],
].map(([nombre, etiqueta, color], i) => ({
  id: i + 1,
  nombre,
  etiqueta,
  tiempo_limite: 60,
  radio: 100,
  color,
  tags: [],
  esta_activo: true,
}));

export const reportesMock: ReportesApi = {
  async incidentes() {
    await delay(150);
    return [...incidentes];
  },

  async listar() {
    await delay(300);
    return [...reportes];
  },

  /** Crea un reporte pendiente en memoria y lo agrega al inicio de la lista de la sesión. */
  async crear(req) {
    await delay(800);
    const nuevo: Reporte = {
      id: Math.random().toString(36).substring(2),
      titulo: req.titulo,
      categorias: req.categorias,
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
    reportes = [nuevo, ...reportes];
    return nuevo;
  },

  async apoyar(id) {
    await delay(300);
    reportes = reportes.map((r) => (r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r));
  },

  /** Suma un apoyo, reemplaza la foto si se proporciona y devuelve el reporte; falla si no existe. */
  async confirmarDuplicado(id, imageBase64) {
    await delay(600);
    reportes = reportes.map((r) =>
      r.id === id
        ? { ...r, upvotes: r.upvotes + 1, ...(imageBase64 !== undefined && { image_url: imageBase64 }) }
        : r,
    );
    const actualizado = reportes.find((r) => r.id === id);
    if (!actualizado) throw new Error(`Reporte ${id} no encontrado`);
    return actualizado;
  },

  async detalle(id) {
    await delay(300);
    const reporte = reportes.find((r) => r.id === id);
    if (!reporte) throw new Error(`Reporte ${id} no encontrado`);
    return reporte;
  },

  /** Devuelve una copia del hilo guardado en memoria, o una lista vacía si no existe. */
  async comentarios(id) {
    await delay(300);
    return [...(comentariosPorReporte.get(id) ?? [])];
  },

  /** Añade al hilo un comentario del usuario simulado y devuelve el comentario creado. */
  async comentar(id, texto) {
    await delay(300);
    const nuevo: ComentarioConAutor = {
      id: siguienteComentarioId++,
      reporte_id: id,
      user_id: 'mock-user-123',
      autor: 'Tú',
      comentario: texto,
      created_at: new Date().toISOString(),
    };
    comentariosPorReporte.set(id, [...(comentariosPorReporte.get(id) ?? []), nuevo]);
    return nuevo;
  },
};
