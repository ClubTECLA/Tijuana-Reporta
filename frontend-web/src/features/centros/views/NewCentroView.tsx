import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LuBuilding2, LuMapPin, LuSend } from "react-icons/lu";
import ColSection from "@/components/layout/ColSection";
import Button from "@/components/ui/Button";
import SearchField from "@/components/ui/SearchField";
import { useCommonPanel } from "@/panels/useCommonPanel";
import { useSysMessage } from "@/components/ui/SysMessageContext";
import { useLocationPicker } from "@/features/mapa/useLocationPicker";
import { useCentros } from "@/features/centros/useCentros";
import { tipoStyle } from "@/features/centros/tiposCentro";
import type { ApiTipoCentro } from "@/types/api-types";

// Límite del backend para el nombre de un centro (centro.yaml).
const NOMBRE_MAX_LENGTH = 50;
const DESCRIPCION_MAX_LENGTH = 500;

const sectionTitleStyle = "text-sm font-semibold text-ink";
const pendingNoteStyle = "text-xs text-ink-muted";
const fieldStyle = "w-full rounded-full border border-line bg-white px-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand";

function TipoCentroCard({ tipo, selected, onClick }: { tipo: ApiTipoCentro; selected: boolean; onClick: () => void }) {
    const { color, icon } = tipoStyle(tipo);
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            style={selected ? { backgroundColor: color } : undefined}
            className={`
                flex h-21 w-full flex-col items-center justify-center gap-1.5 rounded-[12.7px] transition-colors duration-200
                ${selected ? '' : 'border-[1.26px] border-line bg-white hover:bg-subtle'}
            `}
        >
            <span
                className={`flex size-9.5 items-center justify-center rounded-full text-white ${selected ? 'shadow-lift' : ''}`}
                style={{ backgroundColor: `color-mix(in srgb, ${color} 85%, black)` }}
            >
                {icon ? <img src={icon} alt="" className="size-5.5 object-contain" /> : <LuBuilding2 className="size-5" aria-hidden />}
            </span>
            <span className={`text-[11.6px] font-medium leading-3.5 ${selected ? 'text-white' : 'text-ink'}`}>{tipo.nombre}</span>
        </button>
    );
}

// "Crea un centro con su tipo, nombre, descripción, ubicación del marcador y
// lugares. shortcut: sin fotos ni borrador; las fotos esperan un endpoint de subida para centros y el borrador,
// soporte del backend (como en "Nuevo incidente").
function NewCentroForm() {
    const { openPanel } = useCommonPanel();
    const { showMessage } = useSysMessage();
    const { tipos, error: loadError, refresh, crear } = useCentros();
    const { markerElement, position, address, editAddress, search, reset } = useLocationPicker();

    const [tipoId, setTipoId] = useState<number | null>(null);
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    // Texto y no número: el campo puede quedar vacío (sin capacidad registrada).
    const [capacidad, setCapacidad] = useState("");
    const [publishing, setPublishing] = useState(false);
    // Buscando una dirección escrita: el marcador aún no está en ella, así que publicar ahora guardaría la ubicación
    // anterior. search() termina siempre (encontrada, no encontrada, error o cancelada al mover el marcador o salir).
    const [searching, setSearching] = useState(false);

    const tipoList = [...tipos.values()];
    const selectedTipo = tipoId === null ? undefined : tipos.get(tipoId);
    const selectedStyle = tipoStyle(selectedTipo);

    // Al abrir se recargan los tipos (uno recién creado debe aparecer) y el marcador vuelve al mapa libre.
    useEffect(() => {
        void refresh();
    }, [refresh]);

    useEffect(() => {
        reset();
    }, [reset]);

    const handleSearchAddress = async (query: string) => {
        setSearching(true);
        try {
            if (await search(query) === "not-found") {
                showMessage("No encontramos esa dirección en Tijuana.", { color: "yellow", type: "float", title: "Ubicación" });
            }
        } catch {
            showMessage("No se pudo buscar la dirección. Intenta de nuevo.", { color: "red", type: "float", title: "Ubicación" });
        } finally {
            setSearching(false);
        }
    };

    const handlePublish = async () => {
        const nombreLimpio = nombre.trim();
        const lugares = capacidad.trim() === "" ? undefined : Number(capacidad);
        if (tipoId === null) {
            showMessage("Elige qué centro vas a crear.", { color: "red", type: "float", title: "Falta el tipo" });
            return;
        }
        if (!nombreLimpio) {
            showMessage("Escribe el nombre del centro.", { color: "red", type: "float", title: "Falta el nombre" });
            return;
        }
        if (!position) {
            showMessage("Marca la ubicación en el mapa antes de publicar.", { color: "red", type: "float", title: "Falta la ubicación" });
            return;
        }
        if (lugares !== undefined && (!Number.isInteger(lugares) || lugares < 0)) {
            showMessage("Los lugares disponibles deben ser un número entero de 0 o más.", { color: "red", type: "float", title: "Lugares no válidos" });
            return;
        }

        setPublishing(true);
        try {
            const centro = await crear({
                tipo_centro: tipoId,
                nombre: nombreLimpio,
                descripcion: descripcion.trim() || undefined,
                latitude: position.latitude,
                longitude: position.longitude,
                // Recién creado no hay nadie: todos sus lugares están libres.
                capacidad: lugares,
                cantidad: lugares === undefined ? undefined : 0,
            });
            showMessage("El centro ya aparece en la app.", { color: "green", type: "float", title: "Centro publicado" });
            // El detalle reemplaza el formulario en el historial: "atrás" no debe reabrir el formulario enviado.
            openPanel("Detalle Centro", { centroId: centro.id }, { replace: true });
        } catch (error) {
            showMessage(
                error instanceof Error ? error.message : "No se pudo publicar el centro.",
                { color: "red", type: "float", title: "Error al publicar" },
            );
        } finally {
            setPublishing(false);
        }
    };

    return (
        // Mismo ancho y estructura que "Nuevo incidente": el scroll se extiende sobre el relleno para quedar pegado al
        // borde y los botones quedan abajo del todo. Por eso NewCentroView pasa overflow-visible a ColSection. En teléfono,
        // el interior del panel y no w-full, por el mismo motivo que en CentrosView.
        <div className="flex min-h-0 w-[calc(100vw-2.5rem)] flex-1 flex-col font-ui sm:w-[max(25rem,calc(25vw-2rem))]">
            <div className="-mr-3 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-5 pr-3 sm:-mr-4 sm:pr-4">
                <span className="text-xs font-semibold tracking-[0.72px] text-ink-muted">ESCOGE EL CENTRO A CREAR</span>
                {tipoList.length === 0
                    ? <span className={pendingNoteStyle}>{loadError ?? "Cargando tipos de centro…"}</span>
                    : <div className="grid grid-cols-3 gap-2.5">
                        {tipoList.map((tipo) =>
                            <TipoCentroCard key={tipo.id} tipo={tipo} selected={tipo.id === tipoId} onClick={() => setTipoId(tipo.id)} />
                        )}
                    </div>
                }

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="new-centro-nombre" className={sectionTitleStyle}>Nombre</label>
                    <input
                        id="new-centro-nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        maxLength={NOMBRE_MAX_LENGTH}
                        placeholder="Unidad Deportiva Reforma"
                        className={`h-11 ${fieldStyle}`}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="new-centro-descripcion" className={sectionTitleStyle}>Descripción</label>
                    <textarea
                        id="new-centro-descripcion"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        maxLength={DESCRIPCION_MAX_LENGTH}
                        placeholder="Qué ofrece el centro (opcional)"
                        className="h-24 w-full resize-none rounded-[14px] border border-line bg-white p-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="new-centro-address" className={sectionTitleStyle}>Ubicación</label>
                    {/* Controlado: el texto también cambia al mover el marcador (dirección inversa). */}
                    <SearchField
                        format="col"
                        inputId="new-centro-address"
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

                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-4">
                        <label htmlFor="new-centro-lugares" className="text-caption font-semibold text-ink">Lugares disponibles</label>
                        <div className="flex h-11 w-35 shrink-0 items-center gap-2 rounded-full border border-line bg-white px-3 focus-within:border-brand">
                            <input
                                id="new-centro-lugares"
                                type="number"
                                inputMode="numeric"
                                min={0}
                                step={1}
                                value={capacidad}
                                onChange={(e) => setCapacidad(e.target.value)}
                                aria-describedby="new-centro-lugares-ayuda"
                                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none"
                            />
                            <span className="text-caption text-ink-muted" aria-hidden>lugares</span>
                        </div>
                    </div>
                    <span id="new-centro-lugares-ayuda" className={pendingNoteStyle}>
                        Cantidad de lugares con los que contará el centro (opcional)
                    </span>
                </div>
            </div>

            {/* px-4: así caben en una fila en el panel de 400 px; flex-wrap: en teléfono cada uno pasa a la suya. */}
            <div className="flex flex-wrap gap-2.5 border-t border-line pt-3.5">
                <Button variant="subtle" size="lg" title="Guardar borrador" disabled tooltip="Próximamente" className="flex-1 px-4" />
                <Button
                    variant="mint"
                    size="lg"
                    icon={<LuSend />}
                    title={publishing ? "Publicando…" : "Publicar centro"}
                    onClick={handlePublish}
                    disabled={publishing || searching}
                    tooltip={searching ? "Buscando la dirección…" : undefined}
                    className="flex-1 px-4"
                />
            </div>

            {createPortal(
                <div className="relative flex size-12 cursor-grab items-center justify-center active:cursor-grabbing">
                    <span
                        className="flex size-12 items-center justify-center rounded-[12px] border-[3px] border-white text-white shadow-pin"
                        style={{ backgroundColor: selectedTipo ? selectedStyle.color : "var(--color-mint)" }}
                    >
                        {selectedTipo && selectedStyle.icon
                            ? <img src={selectedStyle.icon} alt="" className="size-6.5 object-contain" />
                            : <LuMapPin className="size-6" />}
                    </span>
                    {/* En tablet el mapa libre es más estrecho que el aviso en una línea: se parte en dos. */}
                    <span className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] flex w-max -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 font-ui text-xs font-semibold text-white max-lg:max-w-44 max-lg:whitespace-normal max-lg:rounded-2xl">
                        <LuMapPin className="size-3.5" />
                        Arrastra el marcador o haz clic en el mapa
                    </span>
                </div>,
                markerElement,
            )}
        </div>
    );
}

export default function NewCentroView() {
    return (
        <ColSection
            title="Nuevo centro"
            subtitle="Se publica en la app en cuanto lo guardes"
            arrangementSubsections="toUp"
            className="min-h-0 overflow-visible"
        >
            <NewCentroForm />
        </ColSection>
    );
}
