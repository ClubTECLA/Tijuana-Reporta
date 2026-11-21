import { useEffect, useState, type ReactNode } from "react";
import { LuCheck, LuClock, LuEye, LuMapPin, LuPencil, LuShare, LuTrash2, LuUsers } from "react-icons/lu";
import DetailHero from "@/features/reportes/components/DetailHero";
import DetailRow from "@/features/reportes/components/DetailRow";
import IncidentAction from "@/features/reportes/components/IncidentAction";
import IncidentMoreActions from "@/features/reportes/components/IncidentMoreActions";
import { Badge } from "@/features/reportes/components/Badge";
import { SegmentedTabs, TabItem } from "@/components/ui/SegmentedTabs";
import { folio, formatDateTime, fotoUrl } from "@/features/reportes/reportFormat";
import { direccionDe } from "@/features/mapa/geocoding.services";
import { useCentros } from "@/features/centros/useCentros";
import { tipoStyle } from "@/features/centros/tiposCentro";
import { estaOcupado, lugaresDisponibles, lugaresTexto } from "@/features/centros/centroFormat";
import CentroIcon from "@/features/centros/components/CentroIcon";
import PanelNavButton from "@/components/layout/PanelNavButton";

// shortcut: editar, cambiar el estado (ocupación) y descartar esperan PATCH /centro/{id}, que el backend aún no tiene;
// conectarlas cuando exista.
const SOON = "Próximamente";

// Acciones del detalle, una sola vez: en teléfono van al menú "Más acciones" (title) y desde sm, a la fila (label).
// Para conectar una, darle onClick y quitar su disabled aquí.
const ACCIONES: {
    id: string; label: string; title: string; icon: ReactNode; tone?: "primary" | "danger";
    onClick?: () => void; disabled?: boolean; tooltip?: string;
}[] = [
    { id: "estado", label: "Estado", title: "Cambiar estado", icon: <LuCheck />, tone: "primary", disabled: true, tooltip: SOON },
    { id: "editar", label: "Editar", title: "Editar centro", icon: <LuPencil />, disabled: true, tooltip: SOON },
    { id: "compartir", label: "Compartir", title: "Compartir enlace", icon: <LuShare />, disabled: true, tooltip: SOON },
    { id: "descartar", label: "Descartar", title: "Descartar centro", icon: <LuTrash2 />, tone: "danger", disabled: true, tooltip: SOON },
];
const sectionTitleStyle = "text-xs font-semibold tracking-[0.72px] text-ink-muted";
const noteStyle = "py-6 text-center text-sm text-ink-muted";

// El backend no guarda la dirección de un centro: se pide a Nominatim una vez por punto y se recuerda mientras dure
// la página, para no repetirla al volver a abrir el mismo centro.
const direcciones = new Map<string, string | null>();

function useDireccion(latitude: number | undefined, longitude: number | undefined) {
    const key = latitude === undefined || longitude === undefined ? null : `${latitude},${longitude}`;
    const [loaded, setLoaded] = useState<{ key: string; direccion: string | null } | null>(null);

    useEffect(() => {
        if (key === null || direcciones.has(key)) return;
        const controller = new AbortController();
        direccionDe(latitude!, longitude!, controller.signal)
            .then((direccion) => {
                direcciones.set(key, direccion);
                setLoaded({ key, direccion });
            })
            .catch(() => undefined);
        return () => controller.abort();
    }, [key, latitude, longitude]);

    if (key === null) return null;
    return direcciones.get(key) ?? (loaded?.key === key ? loaded.direccion : null);
}

interface CentroDetailViewProps {
    centroId: string
}

// "Usa el centro que ya tiene CentrosContext (el listado trae todos sus campos).
// Sin la fila "Creador": el API aún no devuelve quién lo creó.
export default function CentroDetailView({ centroId }: CentroDetailViewProps) {
    const { centros, tipos } = useCentros();
    const centro = centros?.find((item) => item.id === centroId);
    const tipo = centro ? tipos.get(centro.tipo_centro) : undefined;
    const direccion = useDireccion(centro?.latitude, centro?.longitude);

    if (!centro) {
        return (
            <div className="flex w-full flex-col font-ui sm:w-[max(25rem,calc(25vw-2rem))]">
                {/* Sin DetailHero no hay regresar ni cerrar: los mismos botones, con el estilo de PanelHeader. */}
                <div className="flex items-center gap-3">
                    <PanelNavButton kind="back" className="bg-subtle hover:bg-line-soft" />
                    <PanelNavButton kind="close" className="ml-auto bg-subtle hover:bg-line-soft" />
                </div>
                <span className={noteStyle}>{centros ? "Este centro ya no está disponible." : "Cargando centro…"}</span>
            </div>
        );
    }

    const { color, icon } = tipoStyle(tipo);
    const lugares = lugaresDisponibles(centro);
    const ocupado = estaOcupado(centro);
    const ubicacion = direccion ?? `${centro.latitude.toFixed(5)}, ${centro.longitude.toFixed(5)}`;
    const estadoBadge = <Badge tone={ocupado ? "danger" : "success"} dot>{ocupado ? "Ocupado" : "Disponible"}</Badge>;
    const folioCentro = <span className="font-mono text-xs font-medium text-ink-muted">{folio(centro.id, "CEN")}</span>;

    return (
        // Mismo ancho fijo que el detalle de incidente (440 px aprox. del Figma).
        <div className="flex h-full min-h-0 w-full flex-col gap-2 font-ui sm:w-[max(25rem,calc(25vw-2rem))]">
            <DetailHero
                color={color}
                icon={icon ? <img src={icon} alt="" className="size-28 opacity-25" /> : null}
                photo={centro.image_path ? fotoUrl(centro.image_path) : undefined}
            >
                <span className="ml-auto flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1.25 text-xs font-semibold text-brand-text">
                    <LuUsers className="size-3.5" aria-hidden />
                    {tipo?.nombre ?? "Centro"}{centro.capacidad !== null && ` · ${centro.capacidad} lugares`}
                </span>
            </DetailHero>

            <div className="flex flex-col gap-2.5 pt-2">
                <div className="flex items-center gap-3">
                    <CentroIcon tipo={tipo} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <h2 className="truncate text-title font-bold text-ink max-sm:text-lg">{centro.nombre}</h2>
                        <span className="flex items-center gap-1 text-caption text-ink-muted">
                            <LuMapPin className="size-3.5 shrink-0" aria-hidden />
                            <span className="truncate">{ubicacion}</span>
                        </span>
                    </div>
                    {/* En teléfono, el estado y el folio junto al título y las acciones en "Más acciones", como el
                        detalle de incidente: deja más alto para la información de abajo. */}
                    <div className="flex shrink-0 flex-col items-end gap-1 sm:hidden">
                        {estadoBadge}
                        {folioCentro}
                    </div>
                    <IncidentMoreActions
                        className="sm:hidden"
                        actions={ACCIONES.map(({ id, title, icon, tone, onClick, disabled, tooltip }) =>
                            ({ id, title, icon, onClick, disabled, tooltip, variant: tone === "danger" ? "danger" : "default" }))}
                    />
                </div>
                {/* En teléfono el estado y el folio ya van junto al título: aquí queda solo la cuenta de lugares (si no
                    la hay, la fila se oculta para no dejar un hueco). */}
                <div className={`flex flex-wrap items-center gap-2 ${lugares === null ? "max-sm:hidden" : ""}`}>
                    <span className="flex max-sm:hidden">{estadoBadge}</span>
                    {lugares !== null && <Badge tone="info">{lugaresTexto(lugares)}</Badge>}
                    <span className="flex max-sm:hidden">{folioCentro}</span>
                </div>
                <div className="flex justify-between pt-1 max-sm:hidden">
                    {ACCIONES.map(({ id, label, icon, tone, onClick, disabled, tooltip }) =>
                        <IncidentAction key={id} icon={icon} label={label} tone={tone} onClick={onClick} disabled={disabled} tooltip={tooltip} />
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2.5 py-2">
                <span className={sectionTitleStyle}>DESCRIPCIÓN ACTUAL</span>
                <p className="text-body leading-5.5 text-ink-secondary">{centro.descripcion?.trim() || "Sin descripción."}</p>
            </div>

            <SegmentedTabs format="row" activeTab={0}>
                <TabItem tabTitle="Resumen" />
            </SegmentedTabs>

            {/* El scroll se extiende sobre el relleno del panel para quedar pegado a su borde derecho. */}
            <div className="-mr-3 flex min-h-0 flex-1 flex-col overflow-y-auto pb-4 pr-3 pt-2 sm:-mr-4 sm:pr-4">
                <div className="flex flex-col divide-y divide-line rounded-2xl border border-line">
                    <DetailRow
                        icon={<LuEye />}
                        label="Visibilidad en la app"
                        value={`${centro.activo ? "Visible" : "Oculto"}${centro.capacidad !== null ? ` · capacidad de ${centro.capacidad} personas` : ""}`}
                    />
                    <DetailRow icon={<LuClock />} label="Registrado" value={formatDateTime(centro.created_at)} />
                </div>
            </div>
        </div>
    );
}
