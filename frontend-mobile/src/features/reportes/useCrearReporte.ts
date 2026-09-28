import { useCallback, useRef, useState } from 'react';
import type { CategoriaReporte, Reporte } from '@/types/api';
import { etiquetaPrincipal, etiquetasDe, tituloReporte } from './crear/categorias';
import { buscarDuplicado } from './crear/duplicados';
import { useConfirmarDuplicado, useCrearReporteMutation } from './hooks';
import { reportesApi } from './api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormState {
  categorias: CategoriaReporte[];
  tags: string[];
  lat: number | null;
  lng: number | null;
  direccion: string | null;
  imageBase64: string | null;
}

interface FormErrors {
  categoria?: string;
  ubicacion?: string;
}

export interface UseCrearReporteReturn {
  form: FormState;
  errors: FormErrors;
  isSubmitting: boolean;
  submitError: string | null;
  /** Reporte devuelto por la API tras enviar; sirve para la pantalla de éxito. */
  creado: Reporte | null;
  /** true si `creado` viene de confirmar un duplicado, no de crear uno nuevo (cambia el copy de éxito). */
  creadoViaDuplicado: boolean;
  /** Distinto de null mientras se espera la decisión de "¿Es el mismo incidente?". */
  duplicado: { reporte: Reporte; distanciaM: number } | null;
  toggleCategoria: (categoria: CategoriaReporte) => void;
  toggleTag: (tag: string) => void;
  setLocation: (lat: number, lng: number, address: string) => void;
  /** Valida y, si hay un reporte parecido cerca, deja `duplicado` listo en vez de enviar. */
  submit: () => Promise<void>;
  /** "Sí, es el mismo": suma una confirmación al reporte existente en vez de crear uno nuevo. */
  confirmarEsElMismo: () => Promise<void>;
  /** "No, es otro": descarta el parecido y crea el reporte nuevo con los datos ya llenados. */
  seguirReportando: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const INITIAL_FORM: FormState = {
  categorias: [],
  tags: [],
  lat: null,
  lng: null,
  direccion: null,
  imageBase64: null,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCrearReporte(): UseCrearReporteReturn {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [creado, setCreado] = useState<Reporte | null>(null);
  const [creadoViaDuplicado, setCreadoViaDuplicado] = useState(false);
  const [duplicado, setDuplicado] = useState<{ reporte: Reporte; distanciaM: number } | null>(null);
  const crear = useCrearReporteMutation();
  const confirmar = useConfirmarDuplicado();
  const enviando = useRef(false);

  // Al elegir una categoría se crea su etiqueta ("Inundación", con el color de la categoría); al
  // quitarla se van también sus etiquetas, para no dejar información adicional huérfana.
  const toggleCategoria = (categoria: CategoriaReporte): void => {
    setForm((prev) => {
      if (prev.categorias.includes(categoria)) {
        const propias = etiquetasDe(categoria).map((e) => e.id);
        return {
          ...prev,
          categorias: prev.categorias.filter((c) => c !== categoria),
          tags: prev.tags.filter((t) => !propias.includes(t)),
        };
      }
      const principal = etiquetaPrincipal(categoria);
      return {
        ...prev,
        categorias: [...prev.categorias, categoria],
        tags: principal && !prev.tags.includes(principal) ? [...prev.tags, principal] : prev.tags,
      };
    });
    setErrors((prev) => ({ ...prev, categoria: undefined }));
  };

  const toggleTag = (tag: string): void => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  // Estable: UbicacionActual lo usa como dependencia al detectar la posición.
  const setLocation = useCallback((lat: number, lng: number, address: string): void => {
    setForm((prev) => ({ ...prev, lat, lng, direccion: address }));
    setErrors((prev) => ({ ...prev, ubicacion: undefined }));
  }, []);

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (form.categorias.length === 0) {
      newErrors.categoria = 'Selecciona al menos una categoría.';
    }

    if (form.lat === null || form.lng === null) {
      newErrors.ubicacion = 'Aún no tenemos tu ubicación.';
    }

    return newErrors;
  };

  const crearNuevo = async (): Promise<Reporte | null> => {
    const categorias = form.categorias;
    const nuevo = await crear.mutateAsync({
      titulo: tituloReporte(categorias[0], form.direccion),
      categorias,
      tags: form.tags,
      lat: form.lat as number,
      lng: form.lng as number,
      ...(form.direccion !== null && { direccion: form.direccion }),
      ...(form.imageBase64 !== null && { image_base64: form.imageBase64 }),
    });
    setCreado(nuevo);
    setCreadoViaDuplicado(false);
    return nuevo;
  };

  // Candado síncrono: `isPending` solo cambia tras el siguiente render, así
  // que dos toques rápidos podrían disparar dos envíos.
  const submit = async (): Promise<void> => {
    if (enviando.current) return;
    enviando.current = true;

    try {
      const validationErrors = validate();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
      setErrors({});

      // Antes de crear, se cruza contra los reportes vigentes por si ya existe
      // uno parecido cerca (misma categoría, mismo rumbo, todavía reciente).
      const reportes = await reportesApi.listar().catch(() => []);
      const match = buscarDuplicado(form.categorias, form.lat as number, form.lng as number, reportes);
      if (match) {
        setDuplicado(match);
        return;
      }

      await crearNuevo();
    } catch (err) {
      console.error('[useCrearReporte] submit error:', err);
    } finally {
      enviando.current = false;
    }
  };

  const confirmarEsElMismo = async (): Promise<void> => {
    if (!duplicado || enviando.current) return;
    enviando.current = true;
    try {
      const actualizado = await confirmar.mutateAsync({
        id: duplicado.reporte.id,
        ...(form.imageBase64 !== null && { imageBase64: form.imageBase64 }),
      });
      setCreado(actualizado);
      setCreadoViaDuplicado(true);
      setDuplicado(null);
    } catch (err) {
      console.error('[useCrearReporte] confirmarEsElMismo error:', err);
    } finally {
      enviando.current = false;
    }
  };

  const seguirReportando = async (): Promise<void> => {
    if (!duplicado || enviando.current) return;
    enviando.current = true;
    try {
      setDuplicado(null);
      await crearNuevo();
    } catch (err) {
      console.error('[useCrearReporte] seguirReportando error:', err);
    } finally {
      enviando.current = false;
    }
  };

  return {
    form,
    errors,
    isSubmitting: crear.isPending || confirmar.isPending,
    submitError: crear.isError || confirmar.isError ? 'No se pudo enviar el reporte. Intenta de nuevo.' : null,
    creado,
    creadoViaDuplicado,
    duplicado,
    toggleCategoria,
    toggleTag,
    setLocation,
    submit,
    confirmarEsElMismo,
    seguirReportando,
  };
}
