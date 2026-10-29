import { createElement } from "react";
import type { ApiIncidente } from "../../types/api-types";
import { categoryIcon, categoryLabel } from "../categories";

interface CategoryCardProps {
    incidente: ApiIncidente
    selected?: boolean
    onClick?: () => void
}

// "Tarjeta de categoría" del Figma: círculo con el color de la categoría y su nombre.
export default function CategoryCard({ incidente, selected = false, onClick }: CategoryCardProps) {
    const label = categoryLabel(incidente.nombre);

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={`
                flex h-21 w-full flex-col items-center justify-center gap-1.5 rounded-[12.7px]
                transition-colors duration-200
                ${selected ? 'bg-brand' : 'border-[1.26px] border-line bg-white hover:bg-subtle'}
            `}
        >
            <span
                className={`flex size-9.5 items-center justify-center rounded-full text-white ${selected ? 'shadow-lift' : ''}`}
                style={{ backgroundColor: incidente.color }}
            >
                {createElement(categoryIcon(incidente.nombre), { className: "size-5", "aria-hidden": true })}
            </span>
            <span className={`text-[11.6px] font-medium leading-3.5 ${selected ? 'text-white' : 'text-ink'}`}>
                {label}
            </span>
        </button>
    );
}
