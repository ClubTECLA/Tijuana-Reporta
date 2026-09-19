import { Reporte } from '../types/api';

export const mockReportes: Reporte[] = [
  {
    id: 'b75f858a-36fb-4c12-8789-58bfa98d248b',
    titulo: 'Socavón en Blvd. Agua Caliente',
    categoria: 'socavon',
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
    categoria: 'arbol',
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
    categoria: 'inundacion',
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
    categoria: 'luz',
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
