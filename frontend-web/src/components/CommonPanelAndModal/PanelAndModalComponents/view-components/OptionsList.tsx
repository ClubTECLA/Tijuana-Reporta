import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import type { subsectionProps } from "../../../../types/utils-types";
import SubSection from "../primitive-components/SubSection";
import { IoIosArrowForward } from "react-icons/io";
import Input from "./Input";
import { validateChildren } from "./validateChildren";

const colorWrapped = {
    'white' : {
        iconStyle: 'text-blue-500 bg-blue-50',
        wrappedStyle: 'bg-white hover:bg-gray-300',
        textStyle: 'text-gray-800',
        descriptionStyle: 'text-gray-500',
        badgeStyle: "text-blue-700"
    },
    'blue' : {
        iconStyle: 'text-blue-500 bg-blue-50',
        wrappedStyle: 'bg-blue-50 hover:bg-blue-300',
        textStyle: 'text-blue-800',
        descriptionStyle: 'text-blue-500',
        badgeStyle: "text-blue-700"
    },
    'red' : {
        iconStyle: 'text-red-500 bg-red-50',
        wrappedStyle: 'bg-red-50 hover:bg-red-300',
        textStyle: 'text-red-800',
        descriptionStyle: 'text-red-500',
        badgeStyle: "text-red-700"
    },
    'yellow' : {
        iconStyle: 'text-yellow-500 bg-yellow-50',
        wrappedStyle: 'bg-yellow-50 hover:bg-yellow-200',
        textStyle: 'text-yellow-800',
        descriptionStyle: 'text-yellow-500',
        badgeStyle: "text-yellow-700"
    },
} as const satisfies Record<string, {
    iconStyle: string,
    wrappedStyle: string,
    textStyle: string,
    descriptionStyle: string,
    badgeStyle: string
}>;

interface listTileProps {
    debug?: boolean;
    color?: keyof typeof colorWrapped;
    icon?: ReactNode;
    tileName: string;
    tileDescription?: string;
    type?: 'button' | 'checkbox';
    valueBagde?: string | number;
    onClick?: () => void;
    onChange?: () => void;
}

export function ListTile({debug, icon, tileName, type = 'button', tileDescription, valueBagde, onChange, onClick, color = 'white'} : listTileProps) {
    return(
        <>
            {type === 'button' && 
                <button
                    onClick={onClick}
                    className={`flex flex-row items-center w-full px-2 py-1 ${colorWrapped[color].wrappedStyle} rounded-2xl ${debug ? 'border-2 border-blue-400' : ''}`}
                >
                    {icon &&
                        <div 
                            className={`
                                rounded-xl ${colorWrapped[color].iconStyle}
                                flex items-center 
                                justify-center w-10 h-10 text-xl
                            `}
                        >{icon}</div>
                    }
                    <div className="flex flex-col items-start justify-center pl-4 w-60">
                        <span className={`font-semibold text-md ${colorWrapped[color].textStyle}`}>{tileName}</span>
                        <span className={`${colorWrapped[color].descriptionStyle} text-sm`}>{tileDescription}</span>
                    </div>
                    {onClick && 
                        <div className="
                            flex flex-row items-center 
                            justify-end text-2xl 
                            text-gray-600 gap-1 
                            w-30 h-10"
                        >
                            <div className={`text-lg font-bold ${colorWrapped[color].badgeStyle}`}>{valueBagde}</div>
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
                                onChange={onChange}
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
            className="flex flex-col mt-2"
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