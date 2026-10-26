import { Children, cloneElement, isValidElement, useState, type ReactNode } from "react";
import type { HexColor, subsectionProps } from "../../../../types/utils-types";
import SubSection from "../primitive-components/SubSection";
import { FiPlus } from "react-icons/fi";

interface CreateTagButton extends Omit<subsectionProps, 'format'>{
    format?: subsectionProps['format'],
    title?: string
    onClick?: () => void
}

export function CreateTagButton({format = 'both-fit', debug, title = 'Agregar', onClick} : CreateTagButton) {
    return(
        <SubSection
            format={format}
            debug={debug}
            className="rounded-3xl bg-brand text-white font-bold flex-row px-3 py-1 items-center justify-center"
            as='button'
            onClick={onClick}
        >
            <FiPlus className="text-lg"/>
            {title}
        </SubSection>
    )
}

interface TagProps extends Omit<subsectionProps, 'format'>{
    value: string;
    badge?: string | number;
    color?: HexColor;
    edit?: boolean;
    onChange?: () => void
}

export function Tag({debug, value, badge, color = '#FFF', edit = false, onChange} : TagProps){
    const [ stateEdit, setStateEdit ] = useState(edit);

    return(
        <SubSection
            format={'col'}
            debug={debug}
            className="flex-row items-center justify-start gap-1 rounded-3xl bg-white px-3
                shadow-raised font-bold py-1
            "
            onDoubleClick={() => setStateEdit(true)}
        >
            <span
                className="rounded-full w-2 h-2 shrink-0"
                style={{ backgroundColor: color }}
            />
            {stateEdit ? (
                <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    onBlur={() => setStateEdit(false)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            setStateEdit(false);
                        }
                    }}
                    className="text-md ml-2 text-ink"
                />
            ) : (
                <span className="text-md text-ink">{value}</span>
            )}
            {badge && (
                <span
                    className="text-md ml-2 text-ink"
                >
                    {badge}
                </span>
            )}
        </SubSection>
    )
}

interface TagPickerProps extends subsectionProps{
    children: ReactNode
    title?: string
}

export function TagPicker({ format, debug, title, children }:TagPickerProps) {
    
    
    return(
        <SubSection
            format={format}
            debug={debug}
            className="flex-col p-2"
        >  
            {title && 
                <span 
                    className="mb-2 font-semibold text-ink"
                >{title}</span>
            }
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 minmax(0,1fr)">
                {Children.map(children, (child) => {

                    if (!isValidElement<subsectionProps>(child)) return child;
                    return cloneElement(child, {
                        format: 'both-full',
                        debug: debug || child.props.debug
                    })
                })}    
            </div>  
        </SubSection>
    )
}