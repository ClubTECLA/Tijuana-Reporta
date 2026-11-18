import { useEffect, useId, useRef, useState } from "react";
import { LuEllipsis } from "react-icons/lu";
import { OptionsMenu, OptionsTile, type OptionTileProps } from "@/components/ui/OptionsMenu";

interface IncidentMoreActionsProps {
    actions: OptionTileProps[]
    className?: string
}

// "Mas Acciones" del Figma: botón de tres puntos que abre el menú con las acciones del incidente. En teléfono sustituye
// a la fila de acciones del detalle para dejar más espacio a la información.
export default function IncidentMoreActions({ actions, className }: IncidentMoreActionsProps) {
    const [open, setOpen] = useState(false);
    // Dónde cabe al abrir: debajo del botón, o encima si abajo no cabe y arriba hay más sitio (pantalla baja), con el
    // alto limitado al espacio disponible y scroll; así ninguna acción queda fuera de la pantalla.
    const [placement, setPlacement] = useState<{ up: boolean; maxHeight: number }>({ up: false, maxHeight: 0 });
    const menuId = useId();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Mismo cierre que FilterSelected: al pulsar fuera del botón y del menú.
    useEffect(() => {
        if (!open) return;
        const closeOnOutsideClick = (event: PointerEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener("pointerdown", closeOnOutsideClick);
        return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
    }, [open]);

    const close = () => {
        setOpen(false);
        buttonRef.current?.focus();
    };

    return (
        <div ref={wrapperRef} className={`relative shrink-0 ${className ?? ""}`}>
            <button
                ref={buttonRef}
                type="button"
                aria-label="Más acciones"
                title="Más acciones"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
                onClick={() => {
                    const button = buttonRef.current?.getBoundingClientRect();
                    // 8 px de separación con el botón y 8 de margen con el borde de la pantalla.
                    const below = window.innerHeight - (button?.bottom ?? 0) - 16;
                    const above = (button?.top ?? 0) - 16;
                    // 240 px: el alto del menú con sus cinco acciones.
                    const up = below < 240 && above > below;
                    setPlacement({ up, maxHeight: up ? above : below });
                    setOpen((value) => !value);
                }}
                className="flex size-11 items-center justify-center rounded-full bg-subtle text-xl text-icon transition hover:brightness-95"
            >
                <LuEllipsis aria-hidden />
            </button>
            {open &&
                <div
                    className={`absolute right-0 z-20 w-70 overflow-y-auto rounded-2xl ${placement.up ? "bottom-full mb-2" : "top-full mt-2"}`}
                    style={{ maxHeight: placement.maxHeight }}
                >
                    <OptionsMenu id={menuId} ariaLabel="Más acciones" onChangeOption={close} onClose={close}>
                        {actions.map((action) => <OptionsTile key={action.id} {...action} />)}
                    </OptionsMenu>
                </div>
            }
        </div>
    );
}
