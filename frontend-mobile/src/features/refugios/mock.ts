import { Image } from 'react-native';
import type { RefugiosApi } from './port';
import type { Refugio } from './types';

const FOTO_REFORMA = Image.resolveAssetSource(require('../../../assets/refugios/unidad-deportiva-reforma.jpg')).uri;

// Datos de prueba. Solo el primero sale del Figma (Modal - Refugio, con su dirección y su ruta); el resto son
// inventados para repartir marcadores por la ciudad y cubrir los casos de la tarjeta: casi lleno, vacío y sin
// capacidad registrada.
const SEED: Refugio[] = [
  {
    id: 'mock-refugio-reforma',
    nombre: 'Unidad Deportiva Reforma',
    descripcion:
      'Espacio seguro que brinda alojamiento temporal, protección y apoyo a personas que necesitan resguardo.',
    imagenUrl: FOTO_REFORMA,
    direccion: 'Segunda Sur 701, Del Rio, 22416 Otay Centenario',
    lat: 32.5274663,
    lng: -116.9928726,
    capacidad: 50,
    ocupados: 15,
  },
  {
    id: 'mock-refugio-zona-rio',
    nombre: 'Gimnasio Municipal Zona Río',
    descripcion: 'Gimnasio habilitado como refugio temporal durante las lluvias.',
    imagenUrl: null,
    direccion: 'Av. Paseo de los Héroes, Zona Urbana Río',
    lat: 32.5271,
    lng: -117.0208,
    capacidad: 80,
    ocupados: 68,
  },
  {
    id: 'mock-refugio-libertad',
    nombre: 'Centro Comunitario Libertad',
    descripcion: null,
    imagenUrl: null,
    direccion: null,
    lat: 32.5348,
    lng: -117.0036,
    capacidad: 120,
    ocupados: 0,
  },
  {
    id: 'mock-refugio-playas',
    nombre: 'Salón Ejidal Playas',
    descripcion: 'Salón con cocina y sanitarios; recibe familias de las colonias cercanas a la costa.',
    imagenUrl: null,
    direccion: 'Playas de Tijuana',
    lat: 32.5313,
    lng: -117.1219,
    capacidad: 60,
    ocupados: 57,
  },
  {
    id: 'mock-refugio-cerro-colorado',
    nombre: 'Escuela Primaria Cerro Colorado',
    descripcion: 'Aulas disponibles como refugio. No se ha registrado la capacidad.',
    imagenUrl: null,
    direccion: null,
    lat: 32.4983,
    lng: -116.9677,
    capacidad: null,
    ocupados: null,
  },
];

export const refugiosMock: RefugiosApi = {
  listar: async () => SEED.map((r) => ({ ...r })),
};
