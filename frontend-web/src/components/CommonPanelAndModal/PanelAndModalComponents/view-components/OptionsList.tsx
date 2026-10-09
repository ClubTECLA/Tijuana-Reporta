import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import type { subsectionProps } from "../../../../types/utils-types";
import SubSection from "../primitive-components/SubSection";
import { IoIosArrowForward } from "react-icons/io";
import Input from "./Input";
import { validateChildren } from "./validateChildren";

interface listTileProps {
    debug?: boolean
    icon?: ReactNode
    tileName: string
    tileDescription?: string
    type?: 'button' | 'checkbox'
    valueBagde?: string | number
    onClick?: () => void
    onChange?: () => void
}

export function ListTile({debug, icon, tileName, type = 'button', tileDescription, valueBagde, onChange, onClick} : listTileProps) {
    return(
        <>
            {type === 'button' && 
                <button
                    onClick={onClick}
                    className={`flex flex-row items-center w-full px-2 py-1 hover:bg-gray-300 rounded-2xl ${debug ? 'border-2 border-blue-400' : ''}`}
                >
                    {icon &&
                        <div 
                            className="
                                rounded-xl bg-blue-50 
                                text-blue-500 flex items-center 
                                justify-center w-10 h-10 text-xl
                            "
                        >{icon}</div>
                    }
                    <div className="flex flex-col items-start justify-center pl-4 w-60">
                        <span className="font-semibold text-md text-gray-800">{tileName}</span>
                        <span className="text-gray-500 text-sm">{tileDescription}</span>
                    </div>
                    {onClick && 
                        <div className="
                            flex flex-row items-center 
                            justify-end text-2xl 
                            text-gray-600 gap-1 
                            w-30 h-10"
                        >
                            <div className="text-lg font-bold text-blue-700">{valueBagde}</div>
                            <IoIosArrowForward/>
                        </div>
                    }
                </button>
            }
            {type === 'checkbox' && 
                <div
                    className={`flex flex-row items-center w-full px-2 py-1 rounded-2xl ${debug ? 'border-2 border-blue-400' : ''}`}
                >
                    <div 
                        className="
                            rounded-xl bg-blue-50 
                            text-blue-500 flex items-center 
                            justify-center w-10 h-10 text-xl
                        "
                    >{icon}</div>
                    <div className="flex flex-col items-start justify-center pl-4 w-60">
                        <span className="font-semibold text-md text-gray-800">{tileName}</span>
                        <span className="text-gray-500 text-sm">{tileDescription}</span>
                    </div>  
                    {onChange &&
                        <div className="
                            flex flex-row items-center 
                            justify-end text-2xl 
                            text-gray-600 
                            w-30 h-10"
                        >
                            <Input
                                type='checkbox'
                                format='col'
                                debug={debug}
                            />
                        </div>

                    }
                </div>
            }
        </>
    )
}

interface optionsListProps extends subsectionProps {
    title?: string
    children: ReactNode
}


export function OptionList({ debug, format, title, children} : optionsListProps) {
    validateChildren(children, "OptionList", [ListTile], "ListTile");

    return(
        <SubSection 
            debug={debug} 
            format={format}
            className="flex flex-col"
        >
            {title && <span className="text-md text-gray-500 font-semibold">{title}</span>}
            <div className="outline-1 outline-gray-300 mt-2 rounded-2xl p-2">
                {Children.map(children, (child) => {
                    if (isValidElement<listTileProps>(child) && child.type === ListTile) {
                        return cloneElement(child, {
                            debug: debug || child.props.debug
                        })
                    }

                    return child;
                })}
            </div>
        </SubSection>
    )
}