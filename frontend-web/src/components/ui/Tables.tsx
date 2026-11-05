import { Children, isValidElement, useId, type ChangeEventHandler, type ReactNode } from "react";
import type { subsectionProps } from "@/types/utils-types";
import SubSection from "@/components/layout/SubSection";

interface SimpleTextProps {
    text: string;
    icon?: ReactNode;
}

export function SimpleText({ text, icon }: SimpleTextProps) {
    return (
        <div className="flex w-50 flex-row items-center justify-start gap-2 p-2">
            {icon && <span>{icon}</span>}
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
    checked: boolean;
    onChange: ChangeEventHandler<HTMLInputElement>;
    id?: string;
}

export function Checkbox({ name, checked, onChange, id }: CheckboxProps) {
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
                className="inline-flex cursor-pointer items-center"
            >
                <span className="sr-only">{name}</span>
                <span
                    aria-hidden="true"
                    className={`
                        relative block h-7 w-14 rounded-full
                        transition-colors
                        after:absolute after:left-1 after:top-1
                        after:h-5 after:w-5 after:rounded-full
                        after:bg-surface after:shadow after:transition-transform
                        after:content-['']
                        ${checked
                            ? "bg-brand after:translate-x-7"
                            : "bg-line after:translate-x-0"}
                    `}
                />
            </label>
        </div>
    );
}


const buttonWrapped: Record<string, string> = {
    'red' : 'bg-danger text-surface',
    'green': 'bg-success text-surface',
    'yellow': 'bg-warning text-surface',
    'blue': 'bg-brand text-surface',
    'gray': 'bg-canvas text-ink',
    'transparent': 'text-ink-muted'
};

interface TdButtonProps {
    onClick?: () => void;
    content: {
        title: string,
        icon?: ReactNode
    } | {
        title?: string,
        icon: ReactNode
    }
    color?: keyof typeof buttonWrapped
}



export function TdButton({color = 'transparent', content, onClick} : TdButtonProps) {
    return(
        <button
            className={`
                ${buttonWrapped[color]}
                flex flex-row items-center pr-4
                justify-center gap-2 rounded-3xl
                p-2
                hover:scale-110 transition-transform duration-300 ease-in-out
                `}

            onClick={onClick}
        >
            {content.icon && 
                <span className="text-2xl">{content.icon}</span>
            }
            {content.title && 
                <span className="text-body font-bold whitespace-nowrap">{content.title}</span>
            }
        </button>
    )
}

const allowedCellTypes = [SimpleText, SimpleStatistics, Checkbox, TdButton];


interface TCellProps {
    className?: string
    children: ReactNode
}

export function TCell({className, children} : TCellProps) {

    return(
        <div
            className={className}
        >
            {children}
        </div>
    )
}

interface TRowProps {
    children: ReactNode;
}


export function TRow({ children }: TRowProps) {
    const cells = Children.toArray(children);

    const tableCells = cells.map((cell, index) => {
        if (
            !isValidElement(cell)
            || ![...allowedCellTypes, TCell].some((allowedType) => cell.type === allowedType)
        ) {
            throw new Error(
                `Invalid cell at position ${index + 1}.`,
            );
        }

        return (
            <td className="bg-surface" key={cell.key ?? index}>
                {cell}
            </td>
        );
    });

    return (
        <tr className="border-t border-line">
            {tableCells}
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
    maxh?: number | string;
    maxw?: number | string;
}

export function Table({ format, debug, headers, children, maxh, maxw }: TableProps) {
    const rows = Children.toArray(children);

    rows.forEach((row, index) => {
        if (!isValidElement<TRowProps>(row) || row.type !== TRow) {
            throw new Error(
                `Table only accepts TRow components as direct children. `
                + `Invalid row at position ${index + 1}.`,
            );
        }

        if (headers && Children.count(row.props.children) !== headers.length) {
            throw new Error(
                `Table row ${index + 1} has ${Children.count(row.props.children)} cells, `
                + `but the table has ${headers.length} headers.`,
            );
        }
    });

    return (
        <SubSection debug={debug} format={format}
            className="rounded-xl border border-line-strong"
        >
            <div
                className={`w-full max-w-full ${maxh != null ? "overflow-y-auto" : "overflow-y-hidden"} overflow-x-auto`}
                style={{
                    ...(maxh != null ? { maxHeight: maxh } : {}),
                    ...(maxw != null ? { maxWidth: maxw } : {}),
                }}
            >
                <table className="w-full border-separate border-spacing-0">
                    {headers && (
                        <thead>
                            <tr>
                                {headers.map((header, index) => (
                                    <th
                                        key={`${header.title}-${index}`}
                                        scope="col"
                                        className={`
                                            sticky top-0 z-10 bg-subtle px-2 py-1 text-left whitespace-nowrap
                                            ${index === 0 ? "rounded-tl-xl" : ""}
                                            ${index === headers.length - 1 ? "rounded-tr-xl" : ""}
                                        `}
                                    >
                                        <span className={`text-caption font-medium ${header.badge ? "text-ink" : "text-ink-muted"}`}>
                                            {header.title.toUpperCase()}
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
