import { useState } from 'react';
import { CategoriaReporte, Reporte } from '../types/api';
import { crearReporte } from '../services/reportes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormState {
  titulo: string;
  descripcion: string; // UI-only; not sent to API
  categoria: CategoriaReporte | null;
  lat: number | null;
  lng: number | null;
  direccion: string | null;
  imageBase64: string | null;
}

interface FormErrors {
  titulo?: string;
  categoria?: string;
  ubicacion?: string;
}

export interface UseCrearReporteReturn {
  form: FormState;
  errors: FormErrors;
  isSubmitting: boolean;
  submitSuccess: boolean;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  setLocation: (lat: number, lng: number, address: string) => void;
  submit: () => Promise<Reporte | null>;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const INITIAL_FORM: FormState = {
  titulo: '',
  descripcion: '',
  categoria: null,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const setField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear the related error when the user edits the field
    if (key === 'titulo') {
      setErrors((prev) => ({ ...prev, titulo: undefined }));
    } else if (key === 'categoria') {
      setErrors((prev) => ({ ...prev, categoria: undefined }));
    } else if (key === 'lat' || key === 'lng') {
      setErrors((prev) => ({ ...prev, ubicacion: undefined }));
    }
  };

  const setLocation = (lat: number, lng: number, address: string): void => {
    setForm((prev) => ({ ...prev, lat, lng, direccion: address }));
    setErrors((prev) => ({ ...prev, ubicacion: undefined }));
  };

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!form.categoria) {
      newErrors.categoria = 'Selecciona una categoría.';
    }

    if (form.lat === null || form.lng === null) {
      newErrors.ubicacion = 'Debes indicar la ubicación del reporte.';
    }

    return newErrors;
  };

  const submit = async (): Promise<Reporte | null> => {
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return null;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const nuevo = await crearReporte({
        titulo: 'Reporte generado desde App',
        categoria: form.categoria as CategoriaReporte,
        tags: [],
        lat: form.lat as number,
        lng: form.lng as number,
        ...(form.direccion !== null && { direccion: form.direccion }),
        ...(form.imageBase64 !== null && { image_base64: form.imageBase64 }),
      });

      setSubmitSuccess(true);
      return nuevo;
    } catch (err) {
      console.error('[useCrearReporte] submit error:', err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = (): void => {
    setForm(INITIAL_FORM);
    setErrors({});
    setSubmitSuccess(false);
  };

  return {
    form,
    errors,
    isSubmitting,
    submitSuccess,
    setField,
    setLocation,
    submit,
    reset,
  };
}
