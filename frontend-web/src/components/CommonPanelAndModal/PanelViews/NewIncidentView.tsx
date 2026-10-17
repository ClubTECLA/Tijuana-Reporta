import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { createPortal } from "react-dom";
import { Marker, type MapMouseEvent } from "maplibre-gl";
import { LuMapPin, LuPlus, LuSearch, LuSend } from "react-icons/lu";
import ColSection from "../PanelAndModalComponents/primitive-components/ColSection";
import CategoryCard from "../PanelAndModalComponents/view-components/CategoryCard";
import PhotoDropzone from "../PanelAndModalComponents/view-components/PhotoDropzone";
import { useMap } from "../../../hooks/useMap";
import { useCommonPanel } from "../../../hooks/useCommonPanel";
import { useSysMessage } from "../../../hooks/contexts/SysMessageContext";
import { useReportes } from "../../../hooks/useReportes";
import { listarIncidentes } from "../../../services/incidentes.services";
import { crearComentario, crearReporte } from "../../../services/reportes.services";
import { buscarDireccion, direccionDe } from "../../../services/geocoding.services";
import type { ApiIncidente } from "../../../types/api-types";

// Tarjetas visibles antes de "Ver las N categorías activas" (Figma: 2 filas de 3).
const VISIBLE_CATEGORIES = 6;
// Límite del backend para un comentario (crear_comentario_request.yaml).
const DESCRIPTION_MAX_LENGTH = 500;

type Position = { latitude: number; longitude: number };

const sectionTitleStyle = "text-sm font-semibold text-ink";
const pendingNoteStyle = "text-xs text-ink-muted";

// "21. Incidente - NuevoIncidente" del Figma. Crea un reporte (POST /reportes) con la categoría
// y la ubicación del marcador; la descripción se guarda como su primer comentario.
// Etiquetas, fotos y borrador esperan soporte del backend.
function NewIncidentForm() {
    const { map } = useMap();
    const { setPanelView } = useCommonPanel();
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

        const placeAt = (latitude: number, longitude: number) => {
            setPosition({ latitude, longitude });
            direccionDe(latitude, longitude)
                .then((found) => setAddress(found ?? ""))
                .catch(() => setAddress(""));
        };

        const center = map.getCenter();
        const marker = new Marker({ element: markerElement, draggable: true, anchor: "center" })
            .setLngLat(center)
            .addTo(map);
        markerRef.current = marker;
        direccionDe(center.lat, center.lng)
            .then((found) => setAddress(found ?? ""))
            .catch(() => setAddress(""));

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
        };
    }, [map, markerElement]);

    const handleSearchAddress = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!address.trim()) return;

        try {
            const found = await buscarDireccion(address);
            if (!found) {
                showMessage("No encontramos esa dirección en Tijuana.", { color: "yellow", type: "float", title: "Ubicación" });
                return;
            }
            markerRef.current?.setLngLat([found.longitude, found.latitude]);
            map?.flyTo({ center: [found.longitude, found.latitude], zoom: 16 });
            setPosition({ latitude: found.latitude, longitude: found.longitude });
            setAddress(found.address);
        } catch {
            showMessage("No se pudo buscar la dirección. Intenta de nuevo.", { color: "red", type: "float", title: "Ubicación" });
        }
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
            if (descriptionSaved) {
                showMessage("El incidente ya aparece en la app.", { color: "green", type: "float", title: "Incidente publicado" });
            } else {
                showMessage(
                    "El incidente se publicó, pero la descripción no se pudo guardar.",
                    { color: "yellow", type: "float", title: "Publicado sin descripción" },
                );
            }
            // Recarga los datos compartidos: la lista y el mapa muestran el incidente nuevo, y su pin se anima.
            markCreated(created.id);
            void refresh();
            // Vuelve a la lista sin dejar este formulario en el historial.
            setPanelView("Incidentes", { replace: true });
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
        // El panel común mide al menos 25vw (sm:min-w-1/4) con 16 px de relleno: el contenido ocupa ese ancho
        // para no dejar hueco a la derecha, y el scroll se extiende sobre el relleno para quedar pegado al borde del panel.
        // El contenido llena el alto del panel: el scroll se estira y los botones quedan abajo del todo, como en el Figma.
        <div className="flex min-h-0 w-full flex-1 flex-col font-['Inter',sans-serif] sm:min-w-[max(25rem,calc(25vw-2rem))]">
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
                        className="flex items-center gap-1.5 self-start text-[13px] font-semibold text-brand-text hover:underline"
                    >
                        <LuPlus className={`size-4 transition-transform ${showAllCategories ? 'rotate-45' : ''}`} />
                        {showAllCategories ? "Ver menos categorías" : `Ver las ${categories.length} categorías activas`}
                    </button>
                }

                <form className="flex flex-col gap-1.5" onSubmit={handleSearchAddress}>
                    <label htmlFor="new-incident-address" className={sectionTitleStyle}>Ubicación</label>
                    <div className="flex h-11 items-center gap-3 rounded-[31px] border border-line bg-white px-3 focus-within:border-brand">
                        <input
                            id="new-incident-address"
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Busca una dirección o colonia"
                            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
                        />
                        <button type="submit" aria-label="Buscar dirección" className="shrink-0 text-icon">
                            <LuSearch className="size-5" />
                        </button>
                    </div>
                    <span className={pendingNoteStyle}>
                        {position
                            ? `Coordenadas ${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)} · ajústala en el mapa`
                            : "Haz clic en el mapa para marcar la ubicación"}
                    </span>
                </form>

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
                <button
                    type="button"
                    disabled
                    title="Próximamente"
                    className="h-12 flex-1 cursor-not-allowed whitespace-nowrap rounded-full bg-subtle px-4 text-base font-bold text-ink opacity-60"
                >
                    Guardar borrador
                </button>
                <button
                    type="button"
                    onClick={handlePublish}
                    disabled={publishing}
                    className="
                        flex h-12 flex-1 items-center justify-center gap-2.5 rounded-full bg-report px-4
                        text-base font-bold whitespace-nowrap text-white drop-shadow-button-report
                        transition duration-200 hover:brightness-90
                        disabled:cursor-wait disabled:opacity-70
                    "
                >
                    <LuSend className="size-5" />
                    {publishing ? "Publicando…" : "Publicar incidente"}
                </button>
            </div>

            {createPortal(
                <div className="relative flex size-12 cursor-grab items-center justify-center active:cursor-grabbing">
                    <span
                        className="flex size-12 items-center justify-center rounded-full border-[3px] border-white text-white shadow-pin"
                        style={{ backgroundColor: selectedCategory?.color ?? "var(--color-brand)" }}
                    >
                        <LuMapPin className="size-6" />
                    </span>
                    <span className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 font-['Inter',sans-serif] text-xs font-semibold text-white">
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
