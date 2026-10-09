import { Children, isValidElement, useId, type ChangeEventHandler, type ReactNode } from "react";
import type { subsectionProps } from "../../../../types/utils-types";
import SubSection from "../primitive-components/SubSection";

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
                        after:bg-white after:shadow after:transition-transform
                        after:content-['']
                        ${checked
                            ? "bg-blue-600 after:translate-x-7"
                            : "bg-gray-300 after:translate-x-0"}
                    `}
                />
            </label>
        </div>
    );
}


const buttonWrapped: Record<string, string> = {
    'red' : 'bg-red-500 text-white',
    'green': 'bg-green-500 text-white',
    'yellow': 'bg-yellow-500 text-white',
    'blue': 'bg-blue-600 text-white',
    'gray': 'bg-gray-200 text-black',
    'transparent': 'text-gray-500'
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
                <span className="text-md font-bold whitespace-nowrap">{content.title}</span>
            }
        </button>
    )
}

const allowedCellTypes = [SimpleText, SimpleStatistics, Checkbox, TdButton];


interface TdItemsWrappedProps {
    className?: string
    children: ReactNode
}

export function TdItemsWrapped({className, children} : TdItemsWrappedProps) {
    const cells = Children.toArray(children);

    const tableCells = cells.map((cell, index) => {
        if (
            !isValidElement(cell)
            || !allowedCellTypes.some((allowedType) => cell.type === allowedType)
        ) {
            throw new Error(
                `Invalid cell at position ${index + 1}.`,
            );
        }

        return cell
    });


    return(
        <div
            className={className}
        >
            {tableCells}
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
            || ![...allowedCellTypes, TdItemsWrapped].some((allowedType) => cell.type === allowedType)
        ) {
            throw new Error(
                `Invalid cell at position ${index + 1}.`,
            );
        }

        return (
            <td className="bg-white" key={cell.key ?? index}>
                {cell}
            </td>
        );
    });

    return (
        <tr className="border-t border-gray-200">
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
}

export function Table({ format, debug, headers, children }: TableProps) {
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
            className="rounded-xl border border-gray-300"
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
                                        bg-gray-100 px-2 py-1 text-left whitespace-nowrap
                                        ${index === 0 ? "rounded-tl-xl" : ""}
                                        ${index === headers.length - 1 ? "rounded-tr-xl" : ""}
                                    `}
                                >
                                    <span className={`text-sm font-medium ${header.badge ? "text-gray-800" : "text-gray-500"}`}>
                                        {header.title.toUpperCase()}
                                    </span>
                                    {header.badge && (
                                        <span className="block text-xs font-medium text-gray-400">
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
        </SubSection>
    );
}
