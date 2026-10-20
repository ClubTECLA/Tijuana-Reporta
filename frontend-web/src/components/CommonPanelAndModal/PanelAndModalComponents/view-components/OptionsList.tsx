import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import type { subsectionProps } from "../../../../types/utils-types";
import SubSection from "../primitive-components/SubSection";
import { IoIosArrowForward } from "react-icons/io";
import Input from "./Input";
import { validateChildren } from "./validateChildren";

const colorWrapped = {
    'white' : {
        iconStyle: 'text-brand bg-brand-subtle',
        wrappedStyle: 'bg-white hover:brightness-95',
        textStyle: 'text-ink',
        descriptionStyle: 'text-ink-muted',
        badgeStyle: "text-brand-text"
    },
    'blue' : {
        iconStyle: 'text-brand bg-brand-subtle',
        wrappedStyle: 'bg-brand-subtle hover:brightness-95',
        textStyle: 'text-brand-text',
        descriptionStyle: 'text-brand',
        badgeStyle: "text-brand-text"
    },
    'red' : {
        iconStyle: 'text-danger bg-danger-subtle',
        wrappedStyle: 'bg-danger-subtle hover:brightness-95',
        textStyle: 'text-danger',
        descriptionStyle: 'text-danger',
        badgeStyle: "text-danger"
    },
    'yellow' : {
        iconStyle: 'text-warning bg-warning-subtle',
        wrappedStyle: 'bg-warning-subtle hover:brightness-95',
        textStyle: 'text-warning',
        descriptionStyle: 'text-warning',
        badgeStyle: "text-warning"
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
                            text-ink-secondary gap-1 
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
                            rounded-xl bg-brand-subtle 
                            text-brand flex items-center 
                            justify-center w-10 h-10 text-xl
                        "
                    >{icon}</div>
                    <div className="flex flex-col items-start justify-center pl-4 w-60">
                        <span className="font-semibold text-md text-ink">{tileName}</span>
                        <span className="text-ink-muted text-sm">{tileDescription}</span>
                    </div>  
                    {onChange &&
                        <div className="
                            flex flex-row items-center 
                            justify-end text-2xl 
                            text-ink-secondary 
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
            {title && <span className="text-md text-ink-muted font-semibold">{title}</span>}
            <div className="outline-1 outline-line mt-2 rounded-2xl p-2">
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