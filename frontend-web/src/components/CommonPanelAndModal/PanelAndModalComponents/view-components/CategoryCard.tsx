import { createElement } from "react";
import type { ApiIncidente } from "../../../../types/api-types";
import { categoryIcon, categoryLabel } from "../../../../types/categories";

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
                ${selected ? 'bg-[#2f6fe0]' : 'border-[1.26px] border-[#e6e9ee] bg-white hover:bg-slate-50'}
            `}
        >
            <span
                className={`flex size-9.5 items-center justify-center rounded-full text-white ${selected ? 'shadow-[0_4px_4px_rgba(0,0,0,0.25)]' : ''}`}
                style={{ backgroundColor: incidente.color }}
            >
                {createElement(categoryIcon(incidente.nombre), { className: "size-5", "aria-hidden": true })}
            </span>
            <span className={`text-[11.6px] font-medium leading-3.5 ${selected ? 'text-white' : 'text-[#1f2733]'}`}>
                {label}
            </span>
        </button>
    );
}
