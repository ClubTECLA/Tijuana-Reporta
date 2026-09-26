import { useId, type ChangeEventHandler } from "react";
import type { subsectionProps } from "../../../types/utils-types";
import SubSection from "../PanelComponents/primitive-components/SubSection";

type inputTypes = 'text' | 'checkbox';

interface inputProps extends subsectionProps {
    type?: inputTypes
    label?: string
    value?: string | number
    checked?: boolean
    defaultChecked?: boolean
    onChange?: ChangeEventHandler<HTMLInputElement>
}

export default function Input({
    type = 'text',
    label,
    debug,
    onChange,
    value,
    checked,
    defaultChecked,
    format
}: inputProps) {
    const inputId = useId();

    const checkboxBetween = !!label && type === 'checkbox' ? true : false;  
    return(
        <SubSection debug={debug} format={format}>
            {type === 'text' &&
                <div className="flex flex-col gap-1 w-full">
                    {label && <label htmlFor={inputId} className="text-md text-gray-700 font-semibold">{label}</label>}
                    <input 
                        id={inputId}
                        className="rounded-full px-3 py-1 outline-1 outline-gray-300"
                        type="text"
                        value={value}
                        onChange={onChange}
                    />
                </div>
            }
            {type === 'checkbox' &&
                <label className={`flex w-full cursor-pointer items-center ${checkboxBetween ?'justify-between' : 'justify-end'} gap-4`}>
                    {label && <span className="text-md text-gray-700 font-semibold">{label}</span>}
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
                        />
                        <span
                            aria-hidden="true"
                            className="
                                relative block h-7 w-15 
                                rounded-full bg-gray-300 
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
            }
        </SubSection>
    )
}