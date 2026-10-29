import { useCallback, useRef, useState } from 'react';
import { mensajeDeError } from '@/lib/estados';
import type { CategoriaReporte, Reporte } from '@/types/api';
import { cambiarCategoria, tituloReporte } from './crear/categorias';
import { buscarDuplicado, desdeDuplicados, RADIO_BUSQUEDA_DUPLICADO_M } from './crear/duplicados';
import type { ErrorFoto } from './foto/crearConFoto';
import { esFotoReintentable, mensajeSubidaFoto } from './foto/errores';
import { elegirFoto as seleccionarFoto, type OrigenFoto } from './foto/seleccionar';
import { useConfirmarDuplicado, useCrearReporteMutation, useSubirFoto } from './hooks';
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
  /** Foto ya reducida (JPEG < 2 MB) lista para subir tras crear el reporte; `null` si no se eligió. */
  fotoUri: string | null;
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
  /** Se está abriendo el selector o reduciendo la foto elegida. */
  preparandoFoto: boolean;
  /** Por qué no se pudo elegir o reducir la foto; `null` si no hay problema. */
  errorSeleccionFoto: string | null;
  /** El usuario negó el permiso de la cámara: hay que mandarlo a Ajustes. */
  sinPermisoCamara: boolean;
  /** El reporte se creó pero su foto no se pudo subir; `null` si no hubo problema. */
  errorFoto: ErrorFoto | null;
  /** Se está reintentando subir la foto de un reporte ya creado. */
  subiendoFoto: boolean;
  /** Abre la cámara o la galería y deja la foto reducida en el formulario. */
  elegirFoto: (origen: OrigenFoto) => Promise<void>;
  quitarFoto: () => void;
  /** Reintenta subir la foto al reporte ya creado, sin crear otro. */
  reintentarFoto: () => Promise<void>;
  /** Elige la categoría (reemplaza a la anterior) o, si ya era la elegida, la deselecciona. */
  elegirCategoria: (categoria: CategoriaReporte) => void;
  toggleTag: (tag: string) => void;
  setLocation: (lat: number, lng: number, address: string) => void;
  /** Valida y, si hay un reporte parecido cerca, deja `duplicado` listo en vez de enviar. */
  submit: () => Promise<void>;
  /** "Sí, es el mismo": suma una confirmación al reporte existente en vez de crear uno nuevo. */
  confirmarEsElMismo: () => Promise<void>;
  /** "No, es otro": descarta el parecido y crea el reporte nuevo con los datos ya llenados. */
  seguirReportando: () => Promise<void>;
  /** Cierra "¿Es el mismo incidente?" y vuelve al formulario con lo ya llenado, sin enviar nada. */
  cancelarDuplicado: () => void;
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
  fotoUri: null,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/** Gestiona el formulario, su validación y la creación o confirmación de reportes duplicados. */
export function useCrearReporte(): UseCrearReporteReturn {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [creado, setCreado] = useState<Reporte | null>(null);
  const [creadoViaDuplicado, setCreadoViaDuplicado] = useState(false);
  const [duplicado, setDuplicado] = useState<{ reporte: Reporte; distanciaM: number } | null>(null);
  // Mientras se descargan los reportes vigentes para buscar un duplicado todavía no hay mutación
  // en curso, pero el botón de enviar ya debe verse ocupado.
  const [buscandoDuplicado, setBuscandoDuplicado] = useState(false);
  const [preparandoFoto, setPreparandoFoto] = useState(false);
  const [errorSeleccionFoto, setErrorSeleccionFoto] = useState<string | null>(null);
  const [sinPermisoCamara, setSinPermisoCamara] = useState(false);
  const [errorFoto, setErrorFoto] = useState<ErrorFoto | null>(null);
  const crear = useCrearReporteMutation();
  const confirmar = useConfirmarDuplicado();
  const subirFoto = useSubirFoto();
  const enviando = useRef(false);
  // Candado síncrono, como `enviando`: dos toques seguidos no deben abrir el selector dos veces.
  const eligiendoFoto = useRef(false);

  /** Abre el selector, reduce la foto y la deja en el formulario. Cancelar no es un error. */
  const elegirFoto = async (origen: OrigenFoto): Promise<void> => {
    if (eligiendoFoto.current) return;
    eligiendoFoto.current = true;
    setPreparandoFoto(true);
    setErrorSeleccionFoto(null);
    setSinPermisoCamara(false);
    try {
      const resultado = await seleccionarFoto(origen);
      if (resultado.tipo === 'ok') setForm((prev) => ({ ...prev, fotoUri: resultado.uri }));
      else if (resultado.tipo === 'sin_permiso') setSinPermisoCamara(true);
      else if (resultado.tipo === 'error') setErrorSeleccionFoto(resultado.mensaje);
    } finally {
      setPreparandoFoto(false);
      eligiendoFoto.current = false;
    }
  };

  const quitarFoto = (): void => {
    setForm((prev) => ({ ...prev, fotoUri: null }));
    setErrorSeleccionFoto(null);
    setSinPermisoCamara(false);
  };

  /** La foto de un reporte que ya existe: reintenta solo la subida, nunca vuelve a crear el reporte. */
  const reintentarFoto = async (): Promise<void> => {
    if (!creado || form.fotoUri === null || subirFoto.isPending) return;
    try {
      const imageUrl = await subirFoto.mutateAsync({ id: creado.id, uri: form.fotoUri });
      setCreado({ ...creado, image_url: imageUrl });
      setErrorFoto(null);
    } catch (err) {
      setErrorFoto({ mensaje: mensajeSubidaFoto(err), reintentable: esFotoReintentable(err) });
    }
  };

  /**
   * Selección única: elegir otra categoría reemplaza a la anterior y tocar la elegida la quita. Se
   * crea la etiqueta de la nueva ("Inundación", con el color de la categoría) y se van las
   * etiquetas de la que se deja, para no dejar información adicional huérfana.
   */
  const elegirCategoria = (categoria: CategoriaReporte): void => {
    setForm((prev) => ({ ...prev, ...cambiarCategoria(prev, categoria) }));
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

  /** Devuelve los errores por falta de categoría o coordenadas en el formulario. */
  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (form.categorias.length === 0) {
      newErrors.categoria = 'Selecciona una categoría.';
    }

    if (form.lat === null || form.lng === null) {
      newErrors.ubicacion = 'Aún no tenemos tu ubicación.';
    }

    return newErrors;
  };

  /** Envía los datos del formulario ya validado y guarda el reporte creado para la pantalla de éxito. */
  const crearNuevo = async (): Promise<Reporte | null> => {
    const categorias = form.categorias;
    const { reporte, errorFoto: falloFoto } = await crear.mutateAsync({
      req: {
        titulo: tituloReporte(categorias[0], form.direccion),
        categorias,
        tags: form.tags,
        lat: form.lat as number,
        lng: form.lng as number,
        ...(form.direccion !== null && { direccion: form.direccion }),
      },
      fotoUri: form.fotoUri,
    });
    setCreado(reporte);
    setCreadoViaDuplicado(false);
    setErrorFoto(falloFoto);
    return reporte;
  };

  // Candado síncrono: `isPending` solo cambia tras el siguiente render, así
  // que dos toques rápidos podrían disparar dos envíos.
  /** Valida el formulario y propone un duplicado cercano o crea un reporte, bloqueando envíos simultáneos. */
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
      // Un error viejo de la otra mutación no debe tapar el de este intento.
      crear.reset();
      confirmar.reset();

      // Antes de crear, se cruza contra los reportes vigentes por si ya existe
      // uno parecido cerca (misma categoría, mismo rumbo, todavía reciente).
      setBuscandoDuplicado(true);
      const reportes = await reportesApi
        .listar({
          desde: desdeDuplicados(new Date()),
          centro: { lat: form.lat as number, lng: form.lng as number },
          radioM: RADIO_BUSQUEDA_DUPLICADO_M,
        })
        .catch(() => [])
        .finally(() => setBuscandoDuplicado(false));
      const match = buscarDuplicado(form.categorias, form.lat as number, form.lng as number, reportes);
      if (match) {
        setDuplicado(match);
        return;
      }

      await crearNuevo();
    } catch (err) {
      console.error('[useCrearReporte] submit error:', err);
    } finally {
      setBuscandoDuplicado(false);
      enviando.current = false;
    }
  };

  /** Confirma el duplicado propuesto y guarda el resultado para mostrar el éxito. */
  const confirmarEsElMismo = async (): Promise<void> => {
    if (!duplicado || enviando.current) return;
    enviando.current = true;
    try {
      crear.reset();
      confirmar.reset();
      // Sin foto: el reporte existente es de otra persona y el backend solo deja subirla a su creador.
      const actualizado = await confirmar.mutateAsync({ id: duplicado.reporte.id });
      setCreado(actualizado);
      setErrorFoto(null);
      setCreadoViaDuplicado(true);
      setDuplicado(null);
    } catch (err) {
      console.error('[useCrearReporte] confirmarEsElMismo error:', err);
    } finally {
      enviando.current = false;
    }
  };

  /** Descarta el duplicado propuesto y crea un reporte con los datos del formulario. */
  const seguirReportando = async (): Promise<void> => {
    if (!duplicado || enviando.current) return;
    enviando.current = true;
    try {
      confirmar.reset();
      setDuplicado(null);
      await crearNuevo();
    } catch (err) {
      console.error('[useCrearReporte] seguirReportando error:', err);
    } finally {
      enviando.current = false;
    }
  };

  const cancelarDuplicado = (): void => {
    if (enviando.current) return;
    confirmar.reset();
    setDuplicado(null);
  };

  return {
    form,
    errors,
    isSubmitting: buscandoDuplicado || crear.isPending || confirmar.isPending || preparandoFoto,
    submitError: crear.isError
      ? mensajeDeError(crear.error, 'No se pudo enviar el reporte. Intenta de nuevo.')
      : confirmar.isError
        ? mensajeDeError(confirmar.error, 'No se pudo confirmar el reporte. Intenta de nuevo.')
        : null,
    creado,
    creadoViaDuplicado,
    duplicado,
    preparandoFoto,
    errorSeleccionFoto,
    sinPermisoCamara,
    errorFoto,
    subiendoFoto: subirFoto.isPending,
    elegirFoto,
    quitarFoto,
    reintentarFoto,
    elegirCategoria,
    toggleTag,
    setLocation,
    submit,
    confirmarEsElMismo,
    seguirReportando,
    cancelarDuplicado,
  };
}
