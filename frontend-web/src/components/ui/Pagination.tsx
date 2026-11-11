import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import SubSection from "@/components/layout/SubSection";
import { getPaginationItems } from "@/lib/pagination";
import { cn } from "@/lib/utils";

export interface PaginationProps {
    /** Página activa actual */
    currentPage: number;
    /** Número total de páginas disponibles */
    totalPages: number;
    /** Evento al hacer clic en un número o flecha */
    onPageChange: (page: number) => void;
    debug?: boolean;
}

const baseButton = cn(
    "size-11 shrink-0 items-center justify-center rounded-xl border",
    "text-caption font-semibold transition-colors",
    "focus-visible:outline-2 focus-visible:outline-brand",
);
const idleButton = cn(
    "border-line-strong bg-surface text-ink",
    "enabled:hover:bg-subtle",
    "disabled:cursor-not-allowed disabled:opacity-50",
);
const activeButton = "border-brand bg-brand text-surface";

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    debug = false,
}: PaginationProps) {
    const pageCount = Math.max(1, Number.isFinite(totalPages) ? Math.floor(totalPages) : 1);
    const page = Math.min(
        Math.max(1, Number.isFinite(currentPage) ? Math.floor(currentPage) : 1),
        pageCount,
    );
    const items = getPaginationItems(page, pageCount);

    return (
        <nav aria-label="Paginación" className="flex select-none items-center gap-2">
            <SubSection
                as="button"
                debug={debug}
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                aria-label="Página anterior"
                className={cn(baseButton, idleButton)}
            >
                <span aria-hidden="true" className="contents">
                    <LuChevronLeft />
                </span>
            </SubSection>

            {items.map((item, index) =>
                item === "ellipsis" ? (
                    <SubSection
                        as="span"
                        debug={debug}
                        key={`ellipsis-${index}`}
                        aria-hidden="true"
                        className="size-11 shrink-0 items-center justify-center text-caption font-semibold text-ink-secondary"
                    >
                        …
                    </SubSection>
                ) : (
                    <SubSection
                        as="button"
                        debug={debug}
                        key={item}
                        onClick={() => item !== page && onPageChange(item)}
                        aria-label={`Página ${item}`}
                        aria-current={page === item ? "page" : undefined}
                        className={cn(baseButton, page === item ? activeButton : idleButton)}
                    >
                        {item}
                    </SubSection>
                ),
            )}

            <SubSection
                as="button"
                debug={debug}
                onClick={() => onPageChange(page + 1)}
                disabled={page === pageCount}
                aria-label="Página siguiente"
                className={cn(baseButton, idleButton)}
            >
                <span aria-hidden="true" className="contents">
                    <LuChevronRight />
                </span>
            </SubSection>
        </nav>
    );
}