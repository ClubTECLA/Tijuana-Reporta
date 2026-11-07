import { Children, isValidElement, useId, type ChangeEventHandler, type ReactNode } from "react";
import SubSection from "@/components/layout/SubSection";
import { cn } from "@/lib/utils";
import type { subsectionProps } from "@/types/utils-types";

const isRenderable = (node: ReactNode) => node != null && typeof node !== "boolean";

interface SimpleTextProps {
    text: string;
    icon?: ReactNode;
}

export function SimpleText({ text, icon }: SimpleTextProps) {
    return (
        <div className="flex w-50 flex-row items-center justify-start gap-2 p-2">
            {isRenderable(icon) && <span>{icon}</span>}
            <span className="font-bold">{text}</span>
        </div>
    );
}

interface SimpleStatisticsProps {
    statistics: string | number;
}

export function SimpleStatistics({ statistics }: SimpleStatisticsProps) {
    return (
        <div className="flex flex-row items-center justify-center gap-2 p-2">
            <span className="font-medium">{statistics}</span>
        </div>
    );
}

interface CheckboxProps {
    name: string;
    /** Texto accesible. Si se omite, se usa `name`. */
    label?: string;
    checked: boolean;
    onChange: ChangeEventHandler<HTMLInputElement>;
    id?: string;
}

export function Checkbox({ name, label, checked, onChange, id }: CheckboxProps) {
    const inputId = useId();
    const checkboxId = id ?? inputId;

    return (
        <div className="flex items-center justify-center p-2">
            <input
                id={checkboxId}
                type="checkbox"
                role="switch"
                checked={checked}
                onChange={onChange}
                name={name}
                className="peer sr-only"
            />
            <label
                htmlFor={checkboxId}
                className={cn(
                    "inline-flex cursor-pointer items-center rounded-full",
                    "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand",
                )}
            >
                <span className="sr-only">{label ?? name}</span>
                <span
                    aria-hidden="true"
                    className={cn(
                        "relative block h-7 w-14 rounded-full transition-colors",
                        "after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full",
                        "after:bg-surface after:shadow after:transition-transform",
                        checked ? "bg-brand after:translate-x-7" : "bg-line after:translate-x-0",
                    )}
                />
            </label>
        </div>
    );
}

const buttonWrapped = {
    red: "bg-danger text-surface",
    green: "bg-success text-surface",
    yellow: "bg-warning text-surface",
    blue: "bg-brand text-surface",
    gray: "bg-canvas text-ink",
    transparent: "text-ink-muted",
} as const satisfies Record<string, string>;

type ButtonColor = keyof typeof buttonWrapped;

type TdButtonProps = {
    onClick?: () => void;
    color?: ButtonColor;
} & (
    | { content: { title: string; icon?: ReactNode }; ariaLabel?: string }
    | { content: { title?: undefined; icon: ReactNode }; ariaLabel: string } // solo icono: nombre obligatorio
);

export function TdButton({ color = "transparent", content, ariaLabel, onClick }: TdButtonProps) {
    const hasTitle = isRenderable(content.title) && content.title !== "";

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            className={cn(
                "flex items-center justify-center gap-2 rounded-3xl p-2",
                hasTitle && "pr-4",
                "transition-transform duration-300 ease-in-out motion-safe:hover:scale-110",
                "focus-visible:outline-2 focus-visible:outline-brand",
                buttonWrapped[color],
            )}
        >
            {isRenderable(content.icon) && <span className="text-2xl">{content.icon}</span>}
            {hasTitle && <span className="text-body font-bold whitespace-nowrap">{content.title}</span>}
        </button>
    );
}

interface TCellProps {
    className?: string;
    children: ReactNode;
}

export function TCell({ className, children }: TCellProps) {
    return <div className={className}>{children}</div>;
}

const allowedCellTypes = [SimpleText, SimpleStatistics, Checkbox, TdButton, TCell];

interface TRowProps {
    children: ReactNode;
}

export function TRow({ children }: TRowProps) {
    const cells = Children.toArray(children);

    return (
        <tr>
            {cells.map((cell, index) => {
                if (
                    import.meta.env.DEV
                    && (!isValidElement(cell) || !allowedCellTypes.some((type) => cell.type === type))
                ) {
                    console.warn(`TRow: unexpected cell at position ${index + 1}.`);
                }

                return (
                    <td
                        key={isValidElement(cell) ? (cell.key ?? index) : index}
                        className="border-t border-line bg-surface"
                    >
                        {cell}
                    </td>
                );
            })}
        </tr>
    );
}

interface HeadCell {
    title: string;
    badge?: string;
}

interface TableProps extends subsectionProps {
    headers?: HeadCell[];
    children?: ReactNode;
    /** Texto accesible de la tabla (solo para lectores de pantalla) */
    caption?: string;
    maxh?: number | string;
    maxw?: number | string;
}

export function Table({ format, debug, headers, caption, children, maxh, maxw }: TableProps) {
    const rows = Children.toArray(children).filter((row, index) => {
        if (!isValidElement<TRowProps>(row) || row.type !== TRow) {
            if (import.meta.env.DEV) {
                console.error(`Table only accepts TRow as children. Invalid row at position ${index + 1}.`);
            }
            return false;
        }

        const rows = Children.toArray(children);

        if (import.meta.env.DEV) {
            rows.forEach((row, index) => {
                if (!isValidElement<TRowProps>(row) || row.type !== TRow) {
                    console.warn(`Table: row ${index + 1} is not a TRow.`);
                    return;
                }
                if (headers) {
                    const cellCount = Children.toArray(row.props.children).length;
                    if (cellCount !== headers.length) {
                        console.warn(
                            `Table row ${index + 1} has ${cellCount} cells, but the table has ${headers.length} headers.`,
                        );
                    }
                }
            });
        }

        return true;
    });

    return (
        <SubSection debug={debug} format={format} className="rounded-xl border border-line-strong">
            <div
                className={cn(
                    "w-full max-w-full overflow-x-auto rounded-xl",
                    maxh != null ? "overflow-y-auto" : "overflow-y-hidden",
                )}
                style={{
                    ...(maxh != null ? { maxHeight: maxh } : {}),
                    ...(maxw != null ? { maxWidth: maxw } : {}),
                }}
            >
                <table className="w-full border-separate border-spacing-0">
                    {caption && <caption className="sr-only">{caption}</caption>}
                    {headers && (
                        <thead>
                            <tr>
                                {headers.map((header, index) => (
                                    <th
                                        key={`${header.title}-${index}`}
                                        scope="col"
                                        className="sticky top-0 z-10 bg-subtle px-2 py-1 text-left whitespace-nowrap"
                                    >
                                        <span
                                            className={cn(
                                                "text-caption font-medium uppercase",
                                                header.badge ? "text-ink" : "text-ink-muted",
                                            )}
                                        >
                                            {header.title}
                                        </span>
                                        {header.badge && (
                                            <span className="block text-caption font-medium text-ink-muted">
                                                {header.badge}
                                            </span>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                    )}
                    <tbody>{rows}</tbody>
                </table>
            </div>
        </SubSection>
    );
}