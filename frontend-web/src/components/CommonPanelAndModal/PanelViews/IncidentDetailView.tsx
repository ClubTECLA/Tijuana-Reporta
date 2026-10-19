import { createElement, useEffect, useState, type SubmitEvent } from "react";
import { LuBell, LuCheck, LuClock, LuDownload, LuImage, LuInfo, LuMapPin, LuPencil, LuSend, LuShare, LuTrash2, LuUser, LuUsers } from "react-icons/lu";
import DetailHero from "../PanelAndModalComponents/view-components/DetailHero";
import IncidentAction from "../PanelAndModalComponents/view-components/IncidentAction";
import DetailRow from "../PanelAndModalComponents/view-components/DetailRow";
import CommentItem, { type CommentAuthor } from "../PanelAndModalComponents/view-components/CommentItem";
import Button from "../PanelAndModalComponents/view-components/Button";
import { Badge, StatusBadge } from "../PanelAndModalComponents/view-components/Badge";
import { SegmentedTabs, TabItem } from "../PanelAndModalComponents/view-components/SegmentedTabs";
import { useAuth } from "../../../hooks/contexts/AuthContext";
import { useReportes } from "../../../hooks/useReportes";
import { useSysMessage } from "../../../hooks/contexts/SysMessageContext";
import { crearComentario, obtenerReporte } from "../../../services/reportes.services";
import { direccionDe } from "../../../services/geocoding.services";
import type { ApiComentario, ApiReporte } from "../../../types/api-types";
import { categoryIcon, categoryLabel } from "../../../types/categories";
import { folio, formatDateTime, pinOfficialFirst } from "../../../types/reportFormat";
import { isOfficialRole, rolLabel } from "../../../types/users";

// Mismo límite que el backend para un comentario (crear_comentario_request.yaml).
const COMMENT_MAX_LENGTH = 500;
const sectionTitleStyle = "text-xs font-semibold tracking-[0.72px] text-ink-muted";
const noteStyle = "py-6 text-center text-sm text-ink-muted";
// Acciones del Figma que aún no tienen endpoint (o lo tienen con error): se muestran deshabilitadas.
const SOON = "Próximamente";
const STATE_PENDING = "Pendiente de backend: cambiar el estado devuelve error";

interface IncidentDetailViewProps {
    reporteId: string
}

// "Panel · Detalle de incidente" del Figma (pantallas 9, 11 y 12): resumen, comentarios e historial.
// La cabecera usa el resumen que ya tiene ReportesContext, así se pinta al instante mientras llega el detalle.
export default function IncidentDetailView({ reporteId }: IncidentDetailViewProps) {
    const { user } = useAuth();
    const { reportes, categories } = useReportes();
    const { showMessage } = useSysMessage();

    const [reporte, setReporte] = useState<ApiReporte | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [tab, setTab] = useState(0);
    const [comment, setComment] = useState("");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        let cancelled = false;

        obtenerReporte(reporteId)
            .then((data) => {
                if (cancelled) return;
                setReporte(data);
                // La dirección es solo informativa: si Nominatim falla se muestran las coordenadas.
                direccionDe(data.latitude, data.longitude)
                    .then((found) => { if (!cancelled) setAddress(found) })
                    .catch(() => undefined);
            })
            .catch((err: unknown) => {
                if (!cancelled) setError(err instanceof Error ? err.message : "No se pudo cargar el incidente.");
            });

        return () => { cancelled = true };
    }, [reporteId]);

    const base = reporte ?? reportes?.find((item) => item.id === reporteId);
    const category = base ? categories.get(base.incidente_id) : undefined;
    const color = category?.color ?? "var(--color-ink-muted)";
    const icon = createElement(categoryIcon(category?.nombre ?? ""), { "aria-hidden": true });

    const handleSendComment = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const text = comment.trim();
        if (!text || sending) return;

        setSending(true);
        try {
            const created = await crearComentario(reporteId, text);
            setReporte((prev) => prev && { ...prev, comentarios: [...prev.comentarios, created] });
            setComment("");
        } catch (err) {
            showMessage(err instanceof Error ? err.message : "No se pudo publicar el comentario.", { color: "red", type: "float", title: "Comentario" });
        } finally {
            setSending(false);
        }
    };

    const confirmations = base?.avistamientos ?? 0;
    const commentCount = reporte?.comentarios.length;

    // shortcut: el backend solo devuelve user_id, así que solo se conoce el autor (y su rol) de los comentarios
    // propios. Cuando el comentario traiga autor y rol, devolverlos aquí: la vista y el orden ya los usan.
    const authorOf = (item: ApiComentario): CommentAuthor | undefined =>
        user && item.user_id === user.id ? { name: user.username, rol: user.rol_name } : undefined;
    const isOfficial = (item: ApiComentario) => isOfficialRole(authorOf(item)?.rol);
    const comments = pinOfficialFirst(reporte?.comentarios ?? [], isOfficial);

    return (
        // Ancho fijo del Figma (440 px aprox.): con w-fit, un comentario largo ensancharía el panel.
        <div className="flex h-full min-h-0 w-full flex-col gap-2 font-['Inter',sans-serif] sm:w-[max(25rem,calc(25vw-2rem))]">
            <DetailHero color={color} icon={icon}>
                {!!reporte?.multimedia.length &&
                    <span className="flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1.25 text-xs font-semibold text-white">
                        <LuImage className="size-3.5" aria-hidden />
                        {reporte.multimedia.length === 1 ? "1 foto" : `${reporte.multimedia.length} fotos`}
                    </span>
                }
                {base &&
                    <span className="ml-auto flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1.25 text-xs font-semibold text-brand-text">
                        <LuUsers className="size-3.5" aria-hidden />
                        {base.es_oficial
                            ? "Aviso oficial"
                            : confirmations
                                ? `Reporte ciudadano · ${confirmations} ${confirmations === 1 ? "vecino" : "vecinos"}`
                                : "Reporte ciudadano"}
                    </span>
                }
            </DetailHero>

            <div className="flex flex-col gap-2.5 pt-2">
                <div className="flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full text-white [&>svg]:size-5.5" style={{ backgroundColor: color }}>
                        {icon}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <h2 className="text-[22px] font-bold text-ink">{category ? categoryLabel(category.nombre) : "Incidente"}</h2>
                        {base &&
                            <span className="flex items-center gap-1 text-[13px] text-ink-muted">
                                <LuMapPin className="size-3.5 shrink-0" aria-hidden />
                                <span className="truncate">{address ?? `${base.latitude.toFixed(5)}, ${base.longitude.toFixed(5)}`}</span>
                            </span>
                        }
                    </div>
                </div>
                {base &&
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge estado={base.estado_actual} />
                        <span className="font-['JetBrains_Mono',monospace] text-xs font-medium text-ink-muted">{folio(base.id)}</span>
                    </div>
                }
                <div className="flex justify-between pt-1">
                    <IncidentAction icon={<LuCheck />} label="Estado" tone="primary" disabled tooltip={STATE_PENDING} />
                    <IncidentAction icon={<LuPencil />} label="Editar" disabled tooltip={SOON} />
                    <IncidentAction icon={<LuShare />} label="Compartir" disabled tooltip={SOON} />
                    <IncidentAction icon={<LuDownload />} label="Exportar" disabled tooltip={SOON} />
                    <IncidentAction icon={<LuTrash2 />} label="Descartar" tone="danger" disabled tooltip={STATE_PENDING} />
                </div>
            </div>

            <SegmentedTabs format="row" activeTab={tab} onChange={setTab}>
                <TabItem tabTitle="Resumen" />
                <TabItem tabTitle="Comentarios" tabBadge={commentCount} />
                <TabItem tabTitle="Historial" />
            </SegmentedTabs>

            {/* El scroll se extiende sobre el relleno del panel para quedar pegado a su borde derecho. */}
            <div className="-mr-3 flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto pb-4 pr-3 pt-2 sm:-mr-4 sm:pr-4">
                {error && <span className={noteStyle}>{error}</span>}
                {!error && !reporte && <span className={noteStyle}>Cargando detalle…</span>}

                {reporte && tab === 0 && <>
                    <section className="flex flex-col gap-1 rounded-2xl bg-subtle px-4 py-3.5">
                        <h3 className="text-sm font-semibold text-ink">Confirmaciones de vecinos</h3>
                        <p className="text-[13px] text-ink-secondary">
                            {reporte.es_oficial
                                ? "Aviso oficial: no necesita confirmaciones de vecinos."
                                : confirmations
                                    ? `${confirmations} ${confirmations === 1 ? "persona confirmó" : "personas confirmaron"} que sigue ocurriendo.`
                                    : "Todavía nadie ha confirmado que sigue ocurriendo."}
                        </p>
                    </section>

                    <section className="flex flex-col divide-y divide-line rounded-2xl border border-line">
                        <DetailRow icon={<LuUser />} label="Primer reporte" value={formatDateTime(reporte.created_at)} />
                        {reporte.updated_at !== reporte.created_at &&
                            <DetailRow icon={<LuClock />} label="Última actualización" value={formatDateTime(reporte.updated_at)} />
                        }
                        {!!category?.radio &&
                            <DetailRow icon={<LuBell />} label="Alerta de proximidad" value={`Radio de ${category.radio} m`} />
                        }
                        <DetailRow icon={<LuMapPin />} label="Coordenadas" value={`${reporte.latitude.toFixed(5)}, ${reporte.longitude.toFixed(5)}`} />
                    </section>

                    <h3 className={sectionTitleStyle}>ETIQUETAS DE LOS REPORTES</h3>
                    {reporte.tags.length
                        ? <div className="flex flex-wrap gap-2">
                            {reporte.tags.map((tag) => <Badge key={tag.id}>{`${tag.nombre} · ${tag.count}`}</Badge>)}
                        </div>
                        : <span className="text-[13px] text-ink-muted">Nadie ha agregado etiquetas todavía.</span>
                    }
                </>}

                {reporte && tab === 1 && (comments.length
                    ? comments.map((item) => <CommentItem key={item.id} comentario={item} author={authorOf(item)} />)
                    : <span className={noteStyle}>Todavía no hay comentarios.</span>
                )}

                {reporte && tab === 2 && <>
                    <ol className="flex flex-col">
                        {[
                            { title: "Reporte recibido", detail: formatDateTime(reporte.created_at) },
                            {
                                title: `Estado actual: ${reporte.estado_actual}`,
                                detail: reporte.updated_at !== reporte.created_at ? `Actualizado ${formatDateTime(reporte.updated_at)}` : "Sin cambios desde que se recibió",
                            },
                        ].map((step, index, steps) =>
                            <li key={step.title} className="relative flex gap-3 pb-4 last:pb-0">
                                {index < steps.length - 1 && <span className="absolute left-2.5 top-6 bottom-0 w-px bg-success" aria-hidden />}
                                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success text-white" aria-hidden>
                                    <LuCheck className="size-3" />
                                </span>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-semibold text-ink">{step.title}</span>
                                    <span className="text-xs text-ink-muted">{step.detail}</span>
                                </div>
                            </li>
                        )}
                    </ol>
                    {/* shortcut: solo creación y estado actual; mostrar todos los cambios cuando el backend exponga el historial. */}
                    <p className="flex gap-2 rounded-2xl bg-brand-subtle px-4 py-3 text-[13px] text-brand-text">
                        <LuInfo className="mt-0.5 size-4 shrink-0" aria-hidden />
                        El historial completo de cambios de estado llegará cuando el backend lo exponga.
                    </p>
                </>}
            </div>

            {reporte && tab === 1 &&
                <form onSubmit={handleSendComment} className="flex items-center gap-2 rounded-full bg-subtle py-1 pl-4 pr-1">
                    <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={COMMENT_MAX_LENGTH}
                        placeholder={user?.rol_name ? `Responder como ${rolLabel(user.rol_name)}…` : "Escribe un comentario"}
                        aria-label="Escribe un comentario"
                        className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
                    />
                    <Button
                        type="submit"
                        variant="report"
                        icon={<LuSend />}
                        ariaLabel="Enviar comentario"
                        disabled={sending || !comment.trim()}
                        className="rounded-full!"
                    />
                </form>
            }
        </div>
    );
}
