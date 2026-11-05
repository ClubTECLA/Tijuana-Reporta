import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { getPaginationItems } from "../../features/usuarios/paginationUtils";
import SubSection from "../layout/SubSection";

export interface PaginationProps{
  /** Página activa actual */
  currentPage: number;
  /** Número total de páginas disponibles */
  totalPages: number;
  /** Evento al hacer clic en un número o flecha */
  onPageChange: (page: number) => void;

  debug?: boolean;
}

const pageButtonStyle = `
    flex size-11 shrink-0 items-center justify-center rounded-xl
    border border-line-strong bg-surface text-ink
    text-caption font-semibold transition-colors hover:bg-subtle
    disabled:cursor-not-allowed disabled:opacity-50
`;

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    debug = false
}: PaginationProps) {
    const pageCount = Math.max(1, Number.isFinite(totalPages) ? Math.floor(totalPages) : 1);
    const page = Math.min(
        Math.max(1, Number.isFinite(currentPage) ? Math.floor(currentPage) : 1),
        pageCount,
    );
    const items = getPaginationItems(page, pageCount);

    return (
        <nav aria-label="Paginación" className="flex items-center gap-2 select-none">
            <SubSection
                as='button'
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                aria-label="Página anterior"
                className={pageButtonStyle}
                debug={debug}
            >
                <LuChevronLeft aria-hidden="true" />
            </SubSection>

            {items.map((item, index) => item === "ellipsis" ? (
                <SubSection
                    as='span'
                    debug={debug}
                    key={`ellipsis-${index}`}
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line-strong bg-surface text-caption font-semibold text-ink-secondary"
                >
                ...
                </SubSection>
            ) : (
                <SubSection
                key={item}
                as='button'
                type="button"
                debug={debug}
                onClick={() => onPageChange(item)}
                aria-label={`Página ${item}`}
                aria-current={page === item ? "page" : undefined}
                className={page === item
                    ? "flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand bg-brand text-caption font-semibold text-surface"
                    : pageButtonStyle}
                >
                {item}
                </SubSection>
            ))}

            <SubSection
                as='button'
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page === pageCount}
                aria-label="Página siguiente"
                className={pageButtonStyle}
                debug={debug}
            >
                <LuChevronRight aria-hidden="true" />
            </SubSection>
        </nav>
    );
}
