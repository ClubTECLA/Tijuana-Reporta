import type { ReactNode } from "react";
import type { subsectionProps } from "../../../../types/utils-types";
import SubSection from "../primitive-components/SubSection";

// Estilos de "Web/Botón" del Figma (Primario, Secundario, Discreto, Peligro) y el botón rojo
// de reportar de las pantallas ("Nuevo incidente", "Publicar").
const variants = {
    primary: "bg-brand text-white hover:bg-brand-text",
    secondary: "border border-line bg-surface text-ink hover:border-brand hover:bg-brand-subtle hover:text-brand-text",
    subtle: "bg-subtle text-ink hover:bg-brand-subtle hover:text-brand-text",
    danger: "border border-danger-line bg-surface text-danger hover:bg-danger-subtle",
    report: "bg-report text-white drop-shadow-button-report hover:brightness-90",
} as const satisfies Record<string, string>;

// sm y md son los tamaños de "Web/Botón"; lg es el botón en píldora de 48 px de las pantallas.
const sizes = {
    sm: "h-8 gap-2 rounded-lg px-3.5 text-caption font-semibold",
    md: "h-10 gap-2 rounded-lg px-4.5 text-sm font-semibold",
    lg: "h-12 gap-2.5 rounded-full px-5.5 text-base font-bold",
} as const satisfies Record<string, string>;

const iconSizes = { sm: "size-4", md: "size-4", lg: "size-5" } as const;

// De format solo se respeta el ancho: la altura la fija el tamaño del botón.
const fullWidthFormats: subsectionProps["format"][] = ["col", "both-full"];

// "Deshabilitado" del Figma: gris claro, texto apagado y 62 % de opacidad en todos los estilos.
const disabledStyle = `
    disabled:cursor-not-allowed disabled:border-line disabled:bg-subtle disabled:text-ink-muted
    disabled:opacity-62 disabled:drop-shadow-none disabled:hover:brightness-100
`;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

interface ButtonProps extends subsectionProps {
    icon?: ReactNode
    title?: string
    variant?: ButtonVariant
    size?: ButtonSize
    onClick?: () => void
    /** Obligatorio si el botón solo tiene icono. */
    ariaLabel?: string
    /** Texto al pasar el ratón (atributo `title`), p. ej. "Próximamente". */
    tooltip?: string
    disabled?: boolean
    type?: "button" | "submit"
    /** Si se indica, el botón es un enlace de react-router. */
    to?: string
}

export default function Button({
    icon,
    title,
    variant = "subtle",
    size = "md",
    onClick,
    ariaLabel,
    tooltip,
    disabled = false,
    type = "button",
    to,
    format,
    debug,
    className,
}: ButtonProps) {
    const classes = `
        ${variants[variant]} ${sizes[size]} ${disabledStyle}
        ${title ? "" : "aspect-square px-0"}
        ${fullWidthFormats.includes(format) ? "w-full" : ""}
        shrink-0 flex-row items-center justify-center whitespace-nowrap
        font-ui transition duration-200
        ${debug ? "border-2" : ""}
        ${className ?? ""}
    `;
    const content = (
        <>
            {icon != null && <span aria-hidden className={`flex items-center justify-center [&>svg]:size-full ${iconSizes[size]}`}>{icon}</span>}
            {title}
        </>
    );
    const commonProps = { debug, format: "nothing" as const, className: classes, onClick, ariaLabel, title: tooltip };

    if (to) {
        return (
            <SubSection as="link" {...commonProps} to={to}>
                {content}
            </SubSection>
        );
    }

    return (
        <SubSection as="button" {...commonProps} type={type} disabled={disabled}>
            {content}
        </SubSection>
    );
}
