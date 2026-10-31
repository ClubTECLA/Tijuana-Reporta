import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { LuMapPin, LuPlus, LuSend } from "react-icons/lu";
import ColSection from "../PanelAndModalComponents/primitive-components/ColSection";
import CategoryCard from "../PanelAndModalComponents/view-components/CategoryCard";
import PhotoDropzone from "../PanelAndModalComponents/view-components/PhotoDropzone";
import Button from "../PanelAndModalComponents/view-components/Button";
import SearchBar from "../PanelAndModalComponents/view-components/SearchBar";
import { useCommonPanel } from "../../../hooks/useCommonPanel";
import { useSysMessage } from "../../../hooks/contexts/SysMessageContext";
import { useReportes } from "../../../hooks/useReportes";
import { useLocationPicker } from "../../../hooks/useLocationPicker";

// Tarjetas visibles antes de "Ver las N categorías activas" (Figma: 2 filas de 3).
const VISIBLE_CATEGORIES = 6;
// Límite del backend para un comentario (crear_comentario_request.yaml).
const DESCRIPTION_MAX_LENGTH = 500;

const sectionTitleStyle = "text-sm font-semibold text-ink";
const pendingNoteStyle = "text-xs text-ink-muted";

// "21. Incidente - NuevoIncidente" del Figma. Publica un reporte con la categoría, la ubicación del marcador y la
// descripción; la publicación (llamadas y fallos parciales) la hace ReportesContext.publicar.
// Etiquetas, fotos y borrador esperan soporte del backend.
function NewIncidentForm() {
    const { openPanel } = useCommonPanel();
    const { showMessage } = useSysMessage();
    const { categories: allCategories, categoriesLoaded, error: loadError, refresh, publicar } = useReportes();

    // Las categorías salen del contexto (una sola descarga); aquí solo las activas. null hasta que llegan, sin
    // depender de los reportes: si la lista de reportes falla, se puede publicar igual.
    const categories = useMemo(
        () => categoriesLoaded ? [...allCategories.values()].filter((category) => category.esta_activo) : null,
        [categoriesLoaded, allCategories],
    );
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [description, setDescription] = useState("");
    const [publishing, setPublishing] = useState(false);
    // Marcador, posición y dirección: el hook se ocupa de MapLibre y Nominatim; aquí solo se pinta el marcador.
    const { markerElement, position, address, editAddress, search } = useLocationPicker();

    const selectedCategory = categories?.find((c) => c.id === categoryId);
    const visibleCategories = showAllCategories ? categories : categories?.slice(0, VISIBLE_CATEGORIES);

    // Al abrir el formulario se recargan los datos compartidos: una categoría recién creada en Ajustes debe aparecer
    // sin esperar al siguiente sondeo.
    useEffect(() => {
        void refresh();
    }, [refresh]);

    const handleSearchAddress = async (query: string) => {
        try {
            if (await search(query) === "not-found") {
                showMessage("No encontramos esa dirección en Tijuana.", { color: "yellow", type: "float", title: "Ubicación" });
            }
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
            const { pendientes } = await publicar({
                categoriaId: categoryId,
                latitude: position.latitude,
                longitude: position.longitude,
                descripcion: description,
            });
            if (pendientes.length) {
                showMessage(
                    `El incidente se publicó, pero ${pendientes.join(" y ")}.`,
                    { color: "yellow", type: "float", title: "Publicado con avisos" },
                );
            } else {
                showMessage("El incidente ya aparece en la app.", { color: "green", type: "float", title: "Incidente publicado" });
            }
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

                {!categories && <span className={pendingNoteStyle}>{loadError ?? "Cargando categorías…"}</span>}
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
                        onChange={editAddress}
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
