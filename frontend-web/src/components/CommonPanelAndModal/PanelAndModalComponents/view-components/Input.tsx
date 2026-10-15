import { useId, type ChangeEventHandler, type ReactNode } from "react";
import type { subsectionProps } from "../../../../types/utils-types";
import SubSection from "../primitive-components/SubSection";

type inputTypes = 'text' | 'number' | 'checkbox';
type labelPositionType = 'top' | 'left';

interface inputProps extends subsectionProps {
  type?: inputTypes;
  label?: string;
  labelPosition?: labelPositionType;
  value?: string | number;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  name?: string;
  placeholder?: string;
  disabled?: boolean;

  /** Elemento o texto opcional al inicio del input (ej. $ o icono) */
  prefix?: ReactNode;
  /** Elemento o texto opcional al final del input (ej. "metros", "kg") */
  suffix?: ReactNode;
  /** Texto descriptivo/ayuda ubicado debajo del componente */
  description?: ReactNode;
}

export default function Input({
  type = 'text',
  label,
  debug,
  onChange,
  value,
  checked,
  defaultChecked,
  format,
  name,
  labelPosition = "top",
  prefix,
  suffix,
  description,
  placeholder,
  disabled = false,
}: inputProps) {
    const inputId = useId();

    if (type === 'checkbox') {
        const checkboxBetween = !!label;

        return (
        <SubSection debug={debug} format={format} className="p-2">
            <div className="flex flex-col gap-1.5 w-full">
            <label className={`flex w-full cursor-pointer items-center ${checkboxBetween ? 'justify-between' : 'justify-end'} gap-4`}>
                {label && <span className="text-md text-slate-800 font-semibold">{label}</span>}
                <span className="inline-flex shrink-0 items-center">
                <input
                    id={inputId}
                    type="checkbox"
                    role="switch"
                    aria-label={label ? undefined : "Activar opción"}
                    checked={checked}
                    defaultChecked={checked === undefined ? defaultChecked : undefined}
                    onChange={onChange}
                    className="peer sr-only"
                    name={name}
                    disabled={disabled}
                />
                <span
                    aria-hidden="true"
                    className="
                    relative block h-7 w-15 
                    rounded-full bg-slate-300 
                    transition-colors 
                    after:absolute after:left-1 after:top-1 
                    after:h-5 after:w-5 after:rounded-full 
                    after:bg-white after:shadow after:transition-transform 
                    after:content-[''] peer-checked:bg-blue-600 
                    peer-checked:after:translate-x-8 
                    peer-focus-visible:outline-2 
                    peer-focus-visible:outline-offset-2 
                    peer-focus-visible:outline-blue-600"
                />
                </span>
            </label>
            {description && (
                <p className="text-sm text-slate-500 font-normal">
                    {description}
                </p>
            )}
            </div>
        </SubSection>
        );
    }

    const isLeft = labelPosition === 'left';

    return (
        <SubSection debug={debug} format={format} className="p-2">
        <div className="flex flex-col gap-2 w-full">
            <div
            className={
                isLeft
                ? "flex items-center justify-between gap-4 w-full"
                : "flex flex-col gap-1.5 w-full"
            }
            >
            {label && (
                <label
                htmlFor={inputId}
                className="text-base text-gray-800 font-bold select-none shrink-0"
                >
                {label}
                </label>
            )}

            <div
                className={`
                    flex items-center gap-2 px-4 py-2.5 
                    border border-slate-400
                    rounded-full shadow-sm transition-all duration-200
                `}
            >
                {prefix && (
                <span className="text-slate-600 text-base font-normal select-none shrink-0 pointer-events-none">
                    {prefix}
                </span>
                )}

                <input
                id={inputId}
                type={type}
                value={value}
                onChange={onChange}
                name={name}
                placeholder={placeholder}
                disabled={disabled}
                className="
                    w-full  outline-none border-none p-0
                    text-slate-800 font-medium placeholder:text-slate-400
                    focus:ring-0
                
                "
                />

                {suffix && (
                <span className="text-slate-400  text-base font-normal select-none shrink-0 pointer-events-none">
                    {suffix}
                </span>
                )}
            </div>
            </div>

            {description && (
            <p className="text-sm text-slate-500 font-normal">
                {description}
            </p>
            )}
        </div>
        </SubSection>
    );
}