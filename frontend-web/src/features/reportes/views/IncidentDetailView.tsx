import { createElement, useState, type SubmitEvent } from "react";
import { LuBell, LuCheck, LuClock, LuDownload, LuImage, LuInfo, LuMapPin, LuPencil, LuSend, LuShare, LuTrash2, LuUser, LuUsers } from "react-icons/lu";
import DetailHero from "@/features/reportes/components/DetailHero";
import IncidentAction from "@/features/reportes/components/IncidentAction";
import DetailRow from "@/features/reportes/components/DetailRow";
import CommentItem, { type CommentAuthor } from "@/features/reportes/components/CommentItem";
import Button from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/features/reportes/components/Badge";
import { SegmentedTabs, TabItem } from "@/components/ui/SegmentedTabs";
import { useAuth } from "@/features/sesion/useAuth";
import { useReportes } from "@/features/reportes/useReportes";
import { useReporteDetalle } from "@/features/reportes/useReporteDetalle";
import { useSysMessage } from "@/components/ui/SysMessageContext";
import type { ApiComentario, ApiEstadoReporte } from "@/types/api-types";
import { categoryIcon } from "@/features/categorias/categories";
import { folio, formatDateTime, fotoUrl, pinOfficialFirst } from "@/features/reportes/reportFormat";
import { isOfficialRole, rolLabel } from "@/features/sesion/users";
import { esEstadoFinal, estadosSiguientes } from "@/features/reportes/estadoTransiciones";

// Mismo límite que el backend para un comentario (crear_comentario_request.yaml).
const COMMENT_MAX_LENGTH = 500;
const sectionTitleStyle = "text-xs font-semibold tracking-[0.72px] text-ink-muted";
const noteStyle = "py-6 text-center text-sm text-ink-muted";
// Acciones del Figma que aún no tienen endpoint: se muestran deshabilitadas.
const SOON = "Próximamente";
const STATE_FORBIDDEN = "Solo los roles oficiales pueden cambiar el estado";
const stateFinal = (estado: ApiEstadoReporte) => `${estado} es un estado final: ya no se puede cambiar`;

interface IncidentDetailViewProps {
    reporteId: string
}

// "Panel · Detalle de incidente" del Figma (pantallas 9, 11 y 12): resumen, comentarios e historial.
// La cabecera usa el resumen que ya tiene ReportesContext, así se pinta al instante mientras llega el detalle.
export default function IncidentDetailView({ reporteId }: IncidentDetailViewProps) {
    const { user } = useAuth();
    const { reportes, categories } = useReportes();
    const { reporte, error, comentar, cambiarEstado } = useReporteDetalle(reporteId);
    const { showMessage } = useSysMessage();

    const [tab, setTab] = useState(0);
    const [comment, setComment] = useState("");
    const [sending, setSending] = useState(false);
    const [stateMenuOpen, setStateMenuOpen] = useState(false);
    const [changingState, setChangingState] = useState(false);
    // Estado final (Resuelto o Descartado) pendiente de confirmar: después ya no se puede cambiar.
    const [confirming, setConfirming] = useState<ApiEstadoReporte | null>(null);

    const base = reporte ?? reportes?.find((item) => item.id === reporteId);
    const category = base ? categories.get(base.incidente_id) : undefined;
    const color = category?.color ?? "var(--color-ink-muted)";
    const icon = createElement(categoryIcon(category?.nombre ?? ""), { "aria-hidden": true });
    const photo = reporte?.multimedia[0];
    // Misma regla que el backend (PATCH /reportes/{id}/estado): cualquier rol menos ciudadano.
    const canChangeState = isOfficialRole(user?.rol_name);
    // Mismas transiciones que el backend: solo se ofrecen los cambios que va a aceptar.
    const nextStates = reporte ? estadosSiguientes(reporte.estado_actual) : [];
    const isFinal = !!reporte && esEstadoFinal(reporte.estado_actual);

    const handleChangeState = async (estado: ApiEstadoReporte) => {
        if (changingState) return;
        setChangingState(true);
        try {
            await cambiarEstado(estado);
            setStateMenuOpen(false);
        } catch (err) {
            showMessage(err instanceof Error ? err.message : "No se pudo cambiar el estado.", { color: "red", type: "float", title: "Estado" });
        } finally {
            setChangingState(false);
            setConfirming(null);
        }
    };

    // Resuelto y Descartado no tienen vuelta atrás: se piden confirmar antes de enviarlos.
    const requestState = (estado: ApiEstadoReporte) => {
        if (esEstadoFinal(estado)) setConfirming(estado);
        else void handleChangeState(estado);
    };

    const handleSendComment = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const text = comment.trim();
        if (!text || sending) return;

        setSending(true);
        try {
            await comentar(text);
            setComment("");
        } catch (err) {
            showMessage(err instanceof Error ? err.message : "No se pudo publicar el comentario.", { color: "red", type: "float", title: "Comentario" });
        } finally {
            setSending(false);
        }
    };

    const confirmations = base?.avistamientos ?? 0;
    const commentCount = reporte?.comentarios.length;

    // El backend devuelve el autor y su rol en cada comentario; sin ellos (respuestas antiguas) se muestra "Usuario".
    const authorOf = (item: ApiComentario): CommentAuthor | undefined =>
        item.username ? { name: item.username, rol: item.rol_name } : undefined;
    const isOfficial = (item: ApiComentario) => isOfficialRole(authorOf(item)?.rol);
    const comments = pinOfficialFirst(reporte?.comentarios ?? [], isOfficial);

    return (
        // Ancho fijo del Figma (440 px aprox.): con w-fit, un comentario largo ensancharía el panel.
        <div className="flex h-full min-h-0 w-full flex-col gap-2 font-ui sm:w-[max(25rem,calc(25vw-2rem))]">
            <DetailHero color={color} icon={icon} photo={photo && fotoUrl(photo.path)}>
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
                        <h2 className="text-title font-bold text-ink">{category?.etiqueta ?? "Incidente"}</h2>
                        {base &&
                            <span className="flex items-center gap-1 text-caption text-ink-muted">
                                <LuMapPin className="size-3.5 shrink-0" aria-hidden />
                                {/* La dirección la guarda quien crea el reporte; sin ella se muestran las coordenadas. */}
                                <span className="truncate">{base.direccion ?? `${base.latitude.toFixed(5)}, ${base.longitude.toFixed(5)}`}</span>
                            </span>
                        }
                    </div>
                </div>
                {base &&
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge estado={base.estado_actual} />
                        <span className="font-mono text-xs font-medium text-ink-muted">{folio(base.id)}</span>
                    </div>
                }
                <div className="flex justify-between pt-1">
                    <IncidentAction
                        icon={<LuCheck />}
                        label="Estado"
                        tone="primary"
                        expanded={stateMenuOpen}
                        onClick={() => { setConfirming(null); setStateMenuOpen((open) => !open) }}
                        disabled={!reporte || !canChangeState || isFinal}
                        tooltip={!canChangeState ? STATE_FORBIDDEN : isFinal ? stateFinal(reporte.estado_actual) : undefined}
                    />
                    <IncidentAction icon={<LuPencil />} label="Editar" disabled tooltip={SOON} />
                    <IncidentAction icon={<LuShare />} label="Compartir" disabled tooltip={SOON} />
                    <IncidentAction icon={<LuDownload />} label="Exportar" disabled tooltip={SOON} />
                    <IncidentAction
                        icon={<LuTrash2 />}
                        label="Descartar"
                        tone="danger"
                        onClick={() => requestState("Descartado")}
                        disabled={!reporte || !canChangeState || changingState || !nextStates.includes("Descartado")}
                        tooltip={!canChangeState ? STATE_FORBIDDEN : isFinal ? stateFinal(reporte.estado_actual) : "Marcar como descartado (no se puede deshacer)"}
                    />
                </div>
                {confirming
                    ? <div role="group" aria-label="Confirmar cambio de estado" className="flex flex-col gap-2.5 rounded-2xl bg-subtle p-3">
                        <p className="text-caption text-ink-secondary">
                            ¿Marcar este incidente como <span className="font-semibold text-ink">{confirming}</span>? Es un estado final: después ya no se podrá cambiar.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button size="sm" variant="secondary" title="Cancelar" onClick={() => setConfirming(null)} disabled={changingState} />
                            <Button
                                size="sm"
                                variant={confirming === "Descartado" ? "danger" : "primary"}
                                title={`Marcar como ${confirming}`}
                                onClick={() => { void handleChangeState(confirming) }}
                                disabled={changingState}
                            />
                        </div>
                    </div>
                    : stateMenuOpen && reporte && !isFinal &&
                    <div role="group" aria-label="Cambiar estado" className="flex flex-wrap gap-2 rounded-2xl bg-subtle p-2.5">
                        {/* Descartado tiene su propio botón. */}
                        {nextStates.filter((estado) => estado !== "Descartado").map((estado) =>
                            <button
                                key={estado}
                                type="button"
                                disabled={changingState}
                                onClick={() => requestState(estado)}
                                className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-brand-subtle disabled:cursor-wait disabled:opacity-60"
                            >
                                {estado}
                            </button>
                        )}
                    </div>
                }
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
                        <p className="text-caption text-ink-secondary">
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
                        : <span className="text-caption text-ink-muted">Nadie ha agregado etiquetas todavía.</span>
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
                    <p className="flex gap-2 rounded-2xl bg-brand-subtle px-4 py-3 text-caption text-brand-text">
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
