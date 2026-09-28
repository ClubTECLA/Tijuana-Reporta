import type { ComentarioConAutor, Reporte } from '@/types/api';
import type { ReportesApi } from './port';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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
];

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

export const reportesMock: ReportesApi = {
  async listar() {
    await delay(300);
    return [...reportes];
  },

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

  async comentarios(id) {
    await delay(300);
    return [...(comentariosPorReporte.get(id) ?? [])];
  },

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
