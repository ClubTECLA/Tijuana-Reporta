import { Children, cloneElement, isValidElement, useEffect, useId, useRef, useState, type ChangeEvent, type MouseEvent, type ReactNode } from "react";
import type { HexColor, subsectionProps } from "../../../../types/utils-types";
import SubSection from "../primitive-components/SubSection";
import { FiPlus } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";

interface CreateTagButton extends Omit<subsectionProps, 'format'>{
    format?: subsectionProps['format'],
    title?: string
    onClick?: (event: MouseEvent<HTMLElement>) => void
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
    editValue?: boolean;
    editBadge?: boolean;
    autoFocus?: boolean;
    onChangeValue?: (event: ChangeEvent<HTMLInputElement>) => void;
    onChangeBadge?: (event: ChangeEvent<HTMLInputElement>) => void;
    onFocusValue?: () => void;
    onFocusBadge?: () => void;
    onBlurValue?: () => void;
    onBlurBadge?: () => void;
    onRemove?: () => void;
}

export function Tag(
    {
        debug, 
        value, 
        badge = 0, 
        color = '#FFF', 
        editValue = false, 
        editBadge = false, 
        autoFocus = false, 
        onChangeValue, 
        onChangeBadge, 
        onFocusValue, 
        onFocusBadge, 
        onBlurValue, 
        onBlurBadge, 
        onRemove
    } : TagProps
){
    const [ stateEditValue, setStateEditValue ] = useState(editValue);
    const [ stateEditBadge, setStateEditBadge ] = useState(editBadge);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const badgeInputRef = useRef<HTMLInputElement | null>(null);
    const previousEditBadgeRef = useRef(stateEditBadge);
    const [badgeValue, setBadgeValue] = useState(String(badge));

    useEffect(() => {
        if (stateEditValue) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [stateEditValue, autoFocus]);

    useEffect(() => {
        if (stateEditBadge && !previousEditBadgeRef.current) {
            badgeInputRef.current?.focus();
            badgeInputRef.current?.select();
        }
        previousEditBadgeRef.current = stateEditBadge;
    }, [stateEditBadge]);

    return(
        <SubSection
            format={'col'}
            debug={debug}
            className="flex-row items-center justify-start gap-1 rounded-3xl bg-white px-3
                shadow-raised font-bold py-1
            "
        >
            <span
                className="rounded-full w-2 h-2 shrink-0"
                style={{ backgroundColor: color }}
            />
            <SubSection
                as='div'
                className="flex flex-row justify-between w-full"
            >
                {stateEditValue ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onFocus={onFocusValue}
                        onChange={onChangeValue}
                        autoFocus={autoFocus}
                        onBlur={() => {
                            setStateEditValue(false);
                            onBlurValue?.();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.currentTarget.blur();
                            }
                        }}
                        className="text-md text-ink w-fit max-w-26 rounded-lg pl-1"
                    />
                ) : (
                    <span
                        className={`text-md ${value ? "text-ink" : "text-gray-500"} min-w-1/2`}
                        onDoubleClick={() => setStateEditValue(true)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setStateEditValue(true);
                            }
                        }}
                        role="button"
                        tabIndex={0}
                    >
                        {value || "sin valor"}
                    </span>
                )}
                {badge !== undefined && badge !== null && badge !== "" &&
                    <>
                    {!stateEditBadge ?
                        <span
                            role="button"
                            tabIndex={0}
                            className="text-md ml-2 text-ink"
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    setBadgeValue(String(badge));
                                    setStateEditBadge(true);
                                }
                            }}
                            onDoubleClick={() => {
                                setBadgeValue(String(badge));
                                setStateEditBadge(true);
                            }}
                        >
                            {badge}
                        </span>
                    :
                        <input
                            ref={badgeInputRef}
                            type="number"
                            min={1}
                            step={1}
                            value={badgeValue}
                            onFocus={onFocusBadge}
                            onBlur={() => {
                                const nextBadge = Number(badgeValue);
                                if (!Number.isInteger(nextBadge) || nextBadge < 1) {
                                    setBadgeValue(String(badge));
                                }
                                setStateEditBadge(false);
                                onBlurBadge?.();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                }
                            }}
                            onChange={(event) => {
                                setBadgeValue(event.target.value);
                                onChangeBadge?.(event);
                            }}
                            aria-label={`Peso de la etiqueta ${value}`}
                            className="
                                w-16 shrink-0 rounded-full
                                border border-line-strong
                                bg-white px-2 py-1 text-center
                                text-sm font-semibold text-ink
                                outline-none transition
                                focus:border-brand
                                focus:ring-2 focus:ring-brand/20
                            "
                        />
                    }
                    </>
                }
            </SubSection>
            {onRemove && (
                <SubSection
                    as='button'
                    type="button"
                    ariaLabel="Eliminar etiqueta"
                    className='h-full flex items-center justify-center hover:scale-110'
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                >
                    <IoMdClose className="p-1/2 text-gray-700 text-xl rounded-2xl"/>
                </SubSection>
            )}
        </SubSection>
    )
}

interface TagPickerProps extends subsectionProps{
    children?: ReactNode
    title?: string
    onCreateTag?: (value: string, badge?: number ) => void
}

interface TagDraft {
    id: string;
    value: string;
    edit: boolean;
    autoFocus: boolean;
    badge: number;
    valueBlurred: boolean;
    badgeBlurred: boolean;
}

function renderTagPickerChildren(
    children: ReactNode,
    debug: boolean | undefined,
    handleAddTag: () => void
) {
    return Children.toArray(children).map((child) => {
        if (!isValidElement<subsectionProps>(child)) return child;

        if (child.type === CreateTagButton) {
            return cloneElement(child, {
                format: 'both-full',
                debug: debug || child.props.debug,
                onClick: (event: MouseEvent<HTMLElement>) => {
                    child.props.onClick?.(event);
                    handleAddTag();
                }
            });
        }

        return cloneElement(child, {
            format: 'both-full',
            debug: debug || child.props.debug
        });
    });
}

export function TagPicker({ format, debug, title, children, onCreateTag }:TagPickerProps) {
    const [extraTag, setExtraTag] = useState<TagDraft | null>(null);
    const completedTagRef = useRef<string | null>(null);
    const tagIdPrefix = useId();
    const [tagIdCounter, setTagIdCounter] = useState(0);

    const handleAddTag = () => {
        const nextTagIdCounter = tagIdCounter + 1;
        setTagIdCounter(nextTagIdCounter);
        const tagId = `${tagIdPrefix}-new-tag-${nextTagIdCounter}`;
        const newTag: TagDraft = {
            id: tagId,
            value: '',
            edit: true,
            autoFocus: true,
            badge: 0,
            valueBlurred: false,
            badgeBlurred: false
        };

        setExtraTag(newTag);

    };

    const handleTagChange = (tagId: string, changes: Partial<TagDraft>) => {
        if (!extraTag || extraTag.id !== tagId) return;
        setExtraTag({
            ...extraTag,
            ...changes
        });
    };

    useEffect(() => {
        if (
            extraTag &&
            extraTag.value.trim() &&
            Number.isInteger(extraTag.badge) &&
            extraTag.badge >= 1 &&
            extraTag.valueBlurred &&
            extraTag.badgeBlurred &&
            completedTagRef.current !== extraTag.id
        ) {
            completedTagRef.current = extraTag.id;
            onCreateTag?.(extraTag.value.trim(), extraTag.badge);
            setExtraTag(null);
            console.log("Tag created: ",extraTag);
        }
    }, [extraTag, onCreateTag]);

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
                {renderTagPickerChildren(children, debug, handleAddTag)}
                {extraTag && (
                    <Tag
                        key={extraTag.id}
                        value={extraTag.value}
                        badge={extraTag.badge}
                        autoFocus={extraTag.autoFocus}
                        editValue={extraTag.edit}
                        editBadge
                        onChangeValue={(event) => handleTagChange(extraTag.id, { value: event.target.value })}
                        onChangeBadge={(event) => {
                            const badge = event.target.valueAsNumber;
                            if (Number.isInteger(badge) && badge >= 1) {
                                handleTagChange(extraTag.id, { badge });
                            }
                        }}
                        onFocusValue={() => handleTagChange(extraTag.id, { valueBlurred: false })}
                        onFocusBadge={() => handleTagChange(extraTag.id, { badgeBlurred: false })}
                        onBlurValue={() => handleTagChange(extraTag.id, { valueBlurred: true })}
                        onBlurBadge={() => handleTagChange(extraTag.id, { badgeBlurred: true })}
                        color="#FFF"
                        onRemove={() => setExtraTag(null)}
                    />
                )}
            </div>
        </SubSection>
    )
}