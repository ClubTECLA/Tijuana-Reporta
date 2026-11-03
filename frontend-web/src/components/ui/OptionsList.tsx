import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import type { subsectionProps } from "@/types/utils-types";
import SubSection from "@/components/layout/SubSection";
import { IoIosArrowForward } from "react-icons/io";
import Input from "./Input";
import { validateChildren } from "@/lib/validateChildren";

// Tono de cada fila: fondo y colores de icono, nombre, descripción e insignia.
const colorWrapped = {
    'white' : {
        iconStyle: 'text-brand bg-brand-subtle',
        wrappedStyle: 'bg-white',
        textStyle: 'text-ink',
        descriptionStyle: 'text-ink-muted',
        badgeStyle: "text-brand-text"
    },
    'blue' : {
        iconStyle: 'text-brand bg-brand-subtle',
        wrappedStyle: 'bg-brand-subtle',
        textStyle: 'text-brand-text',
        descriptionStyle: 'text-brand',
        badgeStyle: "text-brand-text"
    },
    'red' : {
        iconStyle: 'text-danger bg-danger-subtle',
        wrappedStyle: 'bg-danger-subtle',
        textStyle: 'text-danger',
        descriptionStyle: 'text-danger',
        badgeStyle: "text-danger"
    },
    'yellow' : {
        iconStyle: 'text-warning bg-warning-subtle',
        wrappedStyle: 'bg-warning-subtle',
        textStyle: 'text-warning',
        descriptionStyle: 'text-warning',
        badgeStyle: "text-warning"
    },
} as const satisfies Record<string, {
    iconStyle: string,
    wrappedStyle: string,
    textStyle: string,
    descriptionStyle: string,
    badgeStyle: string
}>;

interface listTileProps {
    debug?: boolean;
    color?: keyof typeof colorWrapped;
    icon?: ReactNode;
    tileName: string;
    tileDescription?: string;
    /** "button": la fila entera es un botón con flecha; "checkbox": la fila lleva un interruptor a la derecha. */
    type?: 'button' | 'checkbox';
    /** Valor junto a la flecha (p. ej. el número de sesiones activas). Solo en type="button". */
    valueBadge?: string | number;
    onClick?: () => void;
    onChange?: () => void;
}

// Fila de una lista de opciones (perfil, notificaciones, ayuda, menú de usuario). Las dos variantes comparten
// la misma estructura (icono, nombre y descripción que ocupan el ancho libre, y el control a la derecha) y el tono.
export function ListTile({debug, icon, tileName, type = 'button', tileDescription, valueBadge, onChange, onClick, color = 'white'} : listTileProps) {
    const tone = colorWrapped[color];
    const rowStyle = `flex w-full flex-row items-center gap-4 rounded-2xl px-2 py-1 text-left ${tone.wrappedStyle} ${debug ? 'border-2 border-blue-400' : ''}`;

    const content = <>
        {icon &&
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-xl ${tone.iconStyle}`}>{icon}</span>
        }
        <span className="flex min-w-0 flex-1 flex-col items-start justify-center">
            <span className={`text-base font-semibold ${tone.textStyle}`}>{tileName}</span>
            {tileDescription && <span className={`text-sm ${tone.descriptionStyle}`}>{tileDescription}</span>}
        </span>
    </>;

    if (type === 'checkbox') {
        return (
            <div className={rowStyle}>
                {content}
                {onChange &&
                    <span className="flex h-10 shrink-0 items-center">
                        <Input type='checkbox' format='col' debug={debug} onChange={onChange} ariaLabel={tileName} />
                    </span>
                }
            </div>
        );
    }

    return (
        <button type="button" onClick={onClick} className={`${rowStyle} transition hover:brightness-95`}>
            {content}
            {onClick &&
                <span className="flex h-10 shrink-0 items-center gap-1 text-2xl text-ink-secondary">
                    {valueBadge !== undefined && <span className={`text-lg font-bold ${tone.badgeStyle}`}>{valueBadge}</span>}
                    <IoIosArrowForward aria-hidden />
                </span>
            }
        </button>
    );
}

interface optionsListProps extends subsectionProps {
    title?: string
    children: ReactNode
}

// Lista con título y borde que agrupa filas ListTile; el modo debug de la lista se propaga a cada fila.
export function OptionList({ debug, format, title, children} : optionsListProps) {
    validateChildren(children, "OptionList", [ListTile], "ListTile");

    return(
        <SubSection
            debug={debug}
            format={format}
            className="flex flex-col mt-2"
        >
            {title && <span className="text-base text-ink-muted font-semibold">{title}</span>}
            <div className="outline-1 outline-line mt-2 rounded-2xl p-2">
                {/* validateChildren ya garantiza que todos los hijos son ListTile. */}
                {Children.map(children, (child) =>
                    isValidElement<listTileProps>(child)
                        ? cloneElement(child, { debug: debug || child.props.debug })
                        : child
                )}
            </div>
        </SubSection>
    )
}
