import { useEffect, useState, type CSSProperties } from "react";
import { LuPlus } from "react-icons/lu";
import { useAuth } from "@/features/sesion/useAuth";
import { useCommonPanel } from "@/panels/useCommonPanel";
import { usePanelRight } from "@/panels/usePanelRight";
import { useReportes } from "@/features/reportes/useReportes";
import { timeAgo } from "@/features/reportes/reportFormat";
import Button from "@/components/ui/Button";
import { canPublishIncidents } from "@/features/sesion/users";

// Paneles con los que el Figma quita el botón y deja solo "En vivo" (21. NuevoIncidente, 11-12 detalle).
const PANELS_WITHOUT_BUTTON = ["Nuevo Incidente", "Detalle Incidente"];

function sinceLabel(lastSync: number, now: number) {
    const seconds = Math.max(0, Math.round((now - lastSync) / 1000));
    return seconds < 60 ? `hace ${seconds} s` : timeAgo(new Date(lastSync).toISOString(), now);
}

// "Dock de acciones" del Figma: píldora de vidrio con el estado "En vivo" (última consulta de ReportesContext) y el
// botón "Nuevo incidente". Sin el botón para quien no puede publicar (analista y ciudadano: el backend daría 403).
// Se centra en el mapa que queda libre a la derecha del panel, como en el Figma.
export default function ActionDock() {
    const { isAuthenticated, user } = useAuth();
    const { currentPanelView, openPanel } = useCommonPanel();
    const { lastSync, error } = useReportes();
    const [now, setNow] = useState(() => Date.now());
    const panelRight = usePanelRight();

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    if (!isAuthenticated) return null;

    const showButton = canPublishIncidents(user?.rol_name) && !PANELS_WITHOUT_BUTTON.includes(currentPanelView ?? "");
    const live = lastSync !== null && !error;
    const [title, subtitle] = live
        ? ["En vivo", `Sincronizado con la app ${sinceLabel(lastSync, now)}`]
        : error
            ? ["Reconectando…", lastSync ? `Último dato ${sinceLabel(lastSync, now)}` : "No se pudieron cargar los incidentes"]
            : ["Conectando…", "Cargando incidentes"];

    return (
        <div
            // En móvil el panel ocupa toda la pantalla y el dock queda centrado.
            style={{ "--panel-right": `${panelRight}px` } as CSSProperties}
            className={`
                absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 py-2 font-ui
                sm:left-[calc(var(--panel-right)+(100%-var(--panel-right))/2)]
                rounded-full border border-glass-line bg-glass backdrop-blur-glass drop-shadow-floating
                ${showButton ? "pl-4.5 pr-2" : "px-4.5"}
            `}
        >
            <div className="flex items-center gap-2.5 pr-2.5">
                <span
                    aria-hidden
                    className={`flex size-3.5 shrink-0 items-center justify-center rounded-full
                        ${live ? "bg-success/20" : error ? "bg-danger/20" : "bg-ink-muted/20"}`}
                >
                    <span className={`size-2 rounded-full ${live ? "bg-success" : error ? "bg-danger" : "bg-ink-muted"}`} />
                </span>
                <div className="flex flex-col whitespace-nowrap">
                    {/* role="status" solo en el título: anuncia los cambios de estado, no cada segundo del contador. */}
                    <span role="status" className="text-caption font-bold text-ink-strong">{title}</span>
                    {/* En móvil no cabe junto al botón. */}
                    <span className="text-2xs font-medium text-ink-muted max-sm:hidden">{subtitle}</span>
                </div>
            </div>

            {showButton && <>
                <div className="h-7 w-px shrink-0 bg-line-soft" />
                <Button
                    variant="report"
                    size="lg"
                    icon={<LuPlus />}
                    title="Nuevo incidente"
                    onClick={() => openPanel("Nuevo Incidente")}
                />
            </>}
        </div>
    );
}
