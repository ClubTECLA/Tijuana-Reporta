import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Marker, type MapMouseEvent } from "maplibre-gl";
import { LuMapPin, LuPlus, LuSend } from "react-icons/lu";
import ColSection from "../PanelAndModalComponents/primitive-components/ColSection";
import CategoryCard from "../PanelAndModalComponents/view-components/CategoryCard";
import PhotoDropzone from "../PanelAndModalComponents/view-components/PhotoDropzone";
import Button from "../PanelAndModalComponents/view-components/Button";
import SearchBar from "../PanelAndModalComponents/view-components/SearchBar";
import { useMap } from "../../../hooks/useMap";
import { useCommonPanel } from "../../../hooks/useCommonPanel";
import { useSysMessage } from "../../../hooks/contexts/SysMessageContext";
import { useReportes } from "../../../hooks/useReportes";
import { listarIncidentes } from "../../../services/incidentes.services";
import { cambiarEstadoReporte, crearComentario, crearReporte } from "../../../services/reportes.services";
import { buscarDireccion, direccionDe } from "../../../services/geocoding.services";
import type { ApiIncidente } from "../../../types/api-types";

// Tarjetas visibles antes de "Ver las N categorías activas" (Figma: 2 filas de 3).
const VISIBLE_CATEGORIES = 6;
// Límite del backend para un comentario (crear_comentario_request.yaml).
const DESCRIPTION_MAX_LENGTH = 500;

type Position = { latitude: number; longitude: number };

// Cancela la búsqueda de dirección anterior y devuelve la señal de la nueva.
function restartLookup(ref: { current: AbortController | null }) {
    ref.current?.abort();
    ref.current = new AbortController();
    return ref.current.signal;
}

const sectionTitleStyle = "text-sm font-semibold text-ink";
const pendingNoteStyle = "text-xs text-ink-muted";

// "21. Incidente - NuevoIncidente" del Figma. Crea un reporte (POST /reportes) con la categoría
// y la ubicación del marcador; la descripción se guarda como su primer comentario.
// Etiquetas, fotos y borrador esperan soporte del backend.
function NewIncidentForm() {
    const { map } = useMap();
    const { openPanel } = useCommonPanel();
    const { showMessage } = useSysMessage();
    const { refresh, markCreated } = useReportes();

    const [categories, setCategories] = useState<ApiIncidente[] | null>(null);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [position, setPosition] = useState<Position | null>(() => {
        const center = map?.getCenter();
        return center ? { latitude: center.lat, longitude: center.lng } : null;
    });
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");
    const [publishing, setPublishing] = useState(false);

    // El marcador es un elemento propio de MapLibre; su contenido se pinta con React mediante un portal.
    const [markerElement] = useState(() => document.createElement("div"));
    const markerRef = useRef<Marker | null>(null);
    // Una sola búsqueda de dirección viva (inicial, al mover el marcador, al buscar): cada una, lo que escribe el
    // usuario y cerrar el panel cancelan la anterior. Así una respuesta tardía no pisa la ubicación ni el texto, y lo
    // cancelado sale de la cola de Nominatim en vez de retrasar la búsqueda actual.
    const lookupRef = useRef<AbortController | null>(null);

    const selectedCategory = categories?.find((c) => c.id === categoryId);
    const visibleCategories = showAllCategories ? categories : categories?.slice(0, VISIBLE_CATEGORIES);

    useEffect(() => {
        let cancelled = false;

        listarIncidentes()
            .then((activeCategories) => {
                if (!cancelled) setCategories(activeCategories);
            })
            .catch((error: unknown) => {
                if (cancelled) return;
                setCategories([]);
                showMessage(
                    error instanceof Error ? error.message : "No se pudieron cargar las categorías.",
                    { color: "red", type: "float", title: "Categorías" },
                );
            });

        return () => { cancelled = true };
    }, [showMessage]);

    // Marcador arrastrable: se mueve arrastrándolo o haciendo clic en el mapa, y se quita al cerrar el panel.
    useEffect(() => {
        if (!map) return;

        const lookupAddress = (latitude: number, longitude: number) => {
            const signal = restartLookup(lookupRef);
            direccionDe(latitude, longitude, signal)
                .then((found) => { if (!signal.aborted) setAddress(found ?? "") })
                .catch(() => { if (!signal.aborted) setAddress("") });
        };
        const placeAt = (latitude: number, longitude: number) => {
            setPosition({ latitude, longitude });
            lookupAddress(latitude, longitude);
        };

        const center = map.getCenter();
        const marker = new Marker({ element: markerElement, draggable: true, anchor: "center" })
            .setLngLat(center)
            .addTo(map);
        markerRef.current = marker;
        lookupAddress(center.lat, center.lng);

        const handleDragEnd = () => {
            const { lat, lng } = marker.getLngLat();
            placeAt(lat, lng);
        };
        const handleMapClick = (e: MapMouseEvent) => {
            marker.setLngLat(e.lngLat);
            placeAt(e.lngLat.lat, e.lngLat.lng);
        };

        marker.on("dragend", handleDragEnd);
        map.on("click", handleMapClick);
        map.getCanvas().style.cursor = "crosshair";

        return () => {
            map.off("click", handleMapClick);
            map.getCanvas().style.cursor = "";
            marker.remove();
            markerRef.current = null;
            // Se quiere la búsqueda viva al cerrar (puede ser de handleSearchAddress), no la de cuando montó el efecto.
            // eslint-disable-next-line react-hooks/exhaustive-deps
            lookupRef.current?.abort();
        };
    }, [map, markerElement]);

    const handleSearchAddress = async (query: string) => {
        if (!query.trim()) return;

        // Cancelada si alguien movió el marcador, volvió a escribir o cerró el formulario: así no mueve el mapa ni avisa tarde.
        // Sin marcador (mapa aún sin cargar) tampoco se aplica: la posición publicada debe ser la del marcador.
        const signal = restartLookup(lookupRef);
        const isCurrent = () => !signal.aborted && markerRef.current !== null;
        try {
            const found = await buscarDireccion(query, signal);
            if (!isCurrent()) return;
            if (!found) {
                showMessage("No encontramos esa dirección en Tijuana.", { color: "yellow", type: "float", title: "Ubicación" });
                return;
            }
            markerRef.current?.setLngLat([found.longitude, found.latitude]);
            map?.flyTo({ center: [found.longitude, found.latitude], zoom: 16 });
            setPosition({ latitude: found.latitude, longitude: found.longitude });
            setAddress(found.address);
        } catch {
            if (!isCurrent()) return;
            showMessage("No se pudo buscar la dirección. Intenta de nuevo.", { color: "red", type: "float", title: "Ubicación" });
        }
    };

    // Escribir en el buscador cancela la búsqueda pendiente: lo escrito no se sustituye por una respuesta vieja.
    const handleAddressChange = (text: string) => {
        lookupRef.current?.abort();
        setAddress(text);
    };

    const handlePublish = async () => {
        if (!categoryId) {
            showMessage("Elige qué está pasando antes de publicar.", { color: "red", type: "float", title: "Falta la categoría" });
            return;
        }
        if (!position) {
            showMessage("Marca la ubicación en el mapa antes de publicar.", { color: "red", type: "float", title: "Falta la ubicación" });
            return;
        }

        setPublishing(true);
        try {
            const created = await crearReporte({
                incidente_id: categoryId,
                latitude: position.latitude,
                longitude: position.longitude,
            });
            const descriptionText = description.trim();
            let descriptionSaved = true;
            if (descriptionText) {
                // shortcut: dos llamadas no atómicas; pasar la descripción en crearReporte cuando el backend acepte "comentario".
                // Si falla, el reporte ya existe: no se reintenta la publicación para no duplicarlo.
                descriptionSaved = await crearComentario(created.id, descriptionText).then(() => true, () => false);
            }
            // shortcut: PRUEBA. Los incidentes creados desde el web nacen verificados con una segunda llamada (solo admin).
            // Pasar estado y es_oficial en crearReporte cuando el backend los acepte (validando el rol); hoy es_oficial
            // no se puede activar desde ningún endpoint, así que el incidente queda verificado pero no oficial.
            const verified = await cambiarEstadoReporte(created.id, "Verificado").then(() => true, () => false);

            const pending = [!descriptionSaved && "la descripción no se pudo guardar", !verified && "no se pudo marcar como verificado"].filter(Boolean);
            if (pending.length) {
                showMessage(
                    `El incidente se publicó, pero ${pending.join(" y ")}.`,
                    { color: "yellow", type: "float", title: "Publicado con avisos" },
                );
            } else {
                showMessage("El incidente ya aparece en la app.", { color: "green", type: "float", title: "Incidente publicado" });
            }
            // Recarga los datos compartidos: la lista y el mapa muestran el incidente nuevo, y su pin se anima.
            markCreated(created.id);
            void refresh();
            // Vuelve a la lista sin dejar este formulario en el historial.
            // Tras publicar, la lista reemplaza el formulario: "atrás" no debe reabrir el formulario enviado.
            openPanel("Incidentes", undefined, { replace: true });
        } catch (error) {
            showMessage(
                error instanceof Error ? error.message : "No se pudo publicar el incidente.",
                { color: "red", type: "float", title: "Error al publicar" },
            );
        } finally {
            setPublishing(false);
        }
    };

    return (
        // Ancho fijo de 25vw (el mínimo del panel común) menos su relleno de 16 px. Fijo y no mínimo porque el panel
        // común es w-fit: con un mínimo, una fila larga de etiquetas lo ensancharía antes de que flex-wrap las baje.
        // El scroll se extiende sobre el relleno para quedar pegado al borde, y el contenido llena el alto del panel:
        // los botones quedan abajo del todo, como en el Figma.
        <div className="flex min-h-0 w-full flex-1 flex-col font-ui sm:w-[max(25rem,calc(25vw-2rem))]">
            <div className="-mr-3 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-5 pr-3 sm:-mr-4 sm:pr-4">
                <span className="text-xs font-semibold tracking-[0.72px] text-ink-muted">¿QUÉ ESTÁ PASANDO?</span>

                {!categories && <span className={pendingNoteStyle}>Cargando categorías…</span>}
                {categories?.length === 0 && <span className={pendingNoteStyle}>No hay categorías activas.</span>}
                {!!visibleCategories?.length &&
                    <div className="grid grid-cols-3 gap-2.5">
                        {visibleCategories.map((category) =>
                            <CategoryCard
                                key={category.id}
                                incidente={category}
                                selected={category.id === categoryId}
                                onClick={() => setCategoryId(category.id)}
                            />
                        )}
                    </div>
                }
                {!!categories && categories.length > VISIBLE_CATEGORIES &&
                    <button
                        type="button"
                        onClick={() => setShowAllCategories((prev) => !prev)}
                        className="flex items-center gap-1.5 self-start text-caption font-semibold text-brand-text hover:underline"
                    >
                        <LuPlus className={`size-4 transition-transform ${showAllCategories ? 'rotate-45' : ''}`} />
                        {showAllCategories ? "Ver menos categorías" : `Ver las ${categories.length} categorías activas`}
                    </button>
                }

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="new-incident-address" className={sectionTitleStyle}>Ubicación</label>
                    {/* Controlado: el texto también cambia al mover el marcador (dirección inversa). */}
                    <SearchBar
                        format="col"
                        inputId="new-incident-address"
                        value={address}
                        onChange={handleAddressChange}
                        onSubmit={handleSearchAddress}
                        placeholder="Busca una dirección o colonia"
                    />
                    <span className={pendingNoteStyle}>
                        {position
                            ? `Coordenadas ${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)} · ajústala en el mapa`
                            : "Haz clic en el mapa para marcar la ubicación"}
                    </span>
                </div>

                <PhotoDropzone disabled />

                <div className="flex flex-col gap-2">
                    <span className={sectionTitleStyle}>Etiquetas</span>
                    {/* El backend aún no permite asociar etiquetas al crear el reporte: se muestran las del catálogo. */}
                    {selectedCategory?.tags.length
                        ? <div className="flex flex-wrap gap-2">
                            {selectedCategory.tags.map((tag) =>
                                <button
                                    key={tag.id}
                                    type="button"
                                    disabled
                                    title="Próximamente"
                                    className="cursor-not-allowed rounded-full border border-line bg-white py-2.5 pl-3.5 pr-4 text-sm font-semibold text-ink opacity-60"
                                >
                                    {tag.nombre}
                                </button>
                            )}
                        </div>
                        : <span className={pendingNoteStyle}>
                            {selectedCategory ? "Esta categoría no tiene etiquetas." : "Elige una categoría para ver sus etiquetas."}
                        </span>
                    }
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="new-incident-description" className={sectionTitleStyle}>Descripción</label>
                    <textarea
                        id="new-incident-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={DESCRIPTION_MAX_LENGTH}
                        aria-describedby="new-incident-description-count"
                        placeholder="Describe lo que está pasando (opcional)"
                        className="h-24 w-full resize-none rounded-[14px] border border-line bg-white p-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand"
                    />
                    <span id="new-incident-description-count" className={`${pendingNoteStyle} self-end`}>
                        {description.length}/{DESCRIPTION_MAX_LENGTH}
                    </span>
                </div>
            </div>

            <div className="flex gap-2.5 border-t border-line pt-3.5">
                <Button variant="subtle" size="lg" title="Guardar borrador" disabled tooltip="Próximamente" className="flex-1" />
                <Button
                    variant="report"
                    size="lg"
                    icon={<LuSend />}
                    title={publishing ? "Publicando…" : "Publicar incidente"}
                    onClick={handlePublish}
                    disabled={publishing}
                    className="flex-1"
                />
            </div>

            {createPortal(
                <div className="relative flex size-12 cursor-grab items-center justify-center active:cursor-grabbing">
                    <span
                        className="flex size-12 items-center justify-center rounded-full border-[3px] border-white text-white shadow-pin"
                        style={{ backgroundColor: selectedCategory?.color ?? "var(--color-brand)" }}
                    >
                        <LuMapPin className="size-6" />
                    </span>
                    <span className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 font-ui text-xs font-semibold text-white">
                        <LuMapPin className="size-3.5" />
                        Arrastra el marcador o haz clic en el mapa
                    </span>
                </div>,
                markerElement,
            )}
        </div>
    );
}

export default function NewIncidentView() {
    return (
        <ColSection
            title="Nuevo incidente"
            subtitle="Se publica en la app en cuanto lo guardes"
            arrangementSubsections="toUp"
            className="min-h-0"
        >
            <NewIncidentForm />
        </ColSection>
    );
}
