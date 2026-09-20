import { useCallback, useState } from 'react';
import type { CategoriaReporte, Reporte } from '@/types/api';
import { tituloReporte } from './crear/categorias';
import { useCrearReporteMutation } from './hooks';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormState {
  categoria: CategoriaReporte | null;
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
  setCategoria: (categoria: CategoriaReporte) => void;
  toggleTag: (tag: string) => void;
  setLocation: (lat: number, lng: number, address: string) => void;
  submit: () => Promise<Reporte | null>;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const INITIAL_FORM: FormState = {
  categoria: null,
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
  const crear = useCrearReporteMutation();

  const setCategoria = (categoria: CategoriaReporte): void => {
    setForm((prev) => ({ ...prev, categoria }));
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

    if (!form.categoria) {
      newErrors.categoria = 'Selecciona una categoría.';
    }

    if (form.lat === null || form.lng === null) {
      newErrors.ubicacion = 'Aún no tenemos tu ubicación.';
    }

    return newErrors;
  };

  const submit = async (): Promise<Reporte | null> => {
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return null;
    }

    setErrors({});

    try {
      const categoria = form.categoria as CategoriaReporte;
      const nuevo = await crear.mutateAsync({
        titulo: tituloReporte(categoria, form.direccion),
        categoria,
        tags: form.tags,
        lat: form.lat as number,
        lng: form.lng as number,
        ...(form.direccion !== null && { direccion: form.direccion }),
        ...(form.imageBase64 !== null && { image_base64: form.imageBase64 }),
      });

      setCreado(nuevo);
      return nuevo;
    } catch (err) {
      console.error('[useCrearReporte] submit error:', err);
      return null;
    }
  };

  return {
    form,
    errors,
    isSubmitting: crear.isPending,
    submitError: crear.isError ? 'No se pudo enviar el reporte. Intenta de nuevo.' : null,
    creado,
    setCategoria,
    toggleTag,
    setLocation,
    submit,
  };
}
