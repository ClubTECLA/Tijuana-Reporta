import { Children, cloneElement, type ReactElement, type ReactNode } from "react";
import type { HexColor, subsectionProps } from "../../../../types/utils-types";
import SubSection from "../primitive-components/SubSection";
import { FiPlus } from "react-icons/fi";

interface CreateTagButton extends Omit<subsectionProps, 'format'>{
    format?: subsectionProps['format'],
    title?: string
}

export function CreateTagButton({format = 'both-fit', debug, title = 'Agregar'} : CreateTagButton) {
    return(
        <SubSection
            format={format}
            debug={debug}
            className="rounded-3xl bg-blue-600 text-white font-bold flex-row px-3 py-1 items-center justify-center"
            type='button'
        >
            <FiPlus className="text-lg"/>
            {title}
        </SubSection>
    )
}

interface TagProps extends Omit<subsectionProps, 'format'>{
    name: string;
    badge?: string | number;
    color?: HexColor
}

export function Tag({debug, name, badge, color = '#FFF'} : TagProps){
    return(
        <SubSection
            format={'col'}
            debug={debug}
            className="flex-row items-center justify-start gap-1 rounded-3xl bg-white px-3
                shadow-md shadow-gray-300 font-bold 
            "
        >
            <span
                className="rounded-full w-2 h-2 shrink-0"
                style={{ backgroundColor: color }}
            />
            <span className="text-lg text-slate-800 h-8">{name}</span>
            {badge && (
                <span
                    className=" text-lg ml-2 text-slate-800"
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
                    className="mb-2 font-semibold text-gray-700"
                >{title}</span>
            }
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 minmax(0,1fr)">
                {Children.map(children, (child) => {

                    if(!child) return;
                    return cloneElement(child as ReactElement<subsectionProps>, {
                        format: 'both-full',
                        debug: debug 
                    })
                })}    
            </div>  
        </SubSection>
    )
}