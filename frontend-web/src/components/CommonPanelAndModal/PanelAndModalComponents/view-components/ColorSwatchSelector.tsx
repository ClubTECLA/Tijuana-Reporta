import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode, useRef, useState } from "react";
import type { HexColor, subsectionProps } from "../../../../types/utils-types";
import SubSection from "../primitive-components/SubSection";

interface ColorSwatchesItem extends Omit<subsectionProps, 'format'>{
    color?: HexColor
    onChange?: (color: HexColor) => void
    onClick?: () => void
}

interface CustomColorPickerButtonProps extends ColorSwatchesItem {
  active?: boolean;
  disabled?: boolean;
  className?: string;
  format?: subsectionProps['format']
}

export function CustomColorPickerButton({
  color = '#1f6032',
  onChange,
  active = false,
  disabled = false,
  className = '',
  format = 'both-fit',
  debug
}: CustomColorPickerButtonProps) {
    const colorInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        if (!disabled) {
            colorInputRef.current?.click();
        }
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedColor = e.target.value.toUpperCase() as HexColor;
        onChange?.(selectedColor);
    };

  return (
    <SubSection 
        format={format}
        debug={debug}
        className="relative inline-flex items-center justify-center px-1"
    >
      <input
        ref={colorInputRef}
        type="color"
        value={color}
        onChange={handleColorChange}
        disabled={disabled}
        tabIndex={-1}
        className="sr-only opacity-0 absolute w-0 h-0 pointer-events-none"
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label="Seleccionar color personalizado"
        title="Color personalizado"
        style={{
          background:
            'conic-gradient(from 0deg, #3B82F6, #10B981, #F59E0B, #EF4444, #EC4899, #8B5CF6, #3B82F6)',
        }}
        className={`
          group relative w-8 h-8 rounded-full p-[2.5px]
          transition-all duration-200 cursor-pointer outline-none select-none
          ${active ? 'ring-4 ring-slate-900' : 'hover:scale-105'}
          ${disabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}
          ${className}
        `}
      >
        <div className="w-full h-full rounded-full bg-white dark:bg-white flex items-center justify-center transition-colors group-hover:bg-slate-50 dark:group-hover:bg-slate-300">
          <svg
            className="w-3.5 h-3.5 text-slate-800 dark:text-black transition-transform group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
      </button>
    </SubSection>
  );
}

interface SwatchItemProps extends ColorSwatchesItem {
    active?: boolean
    format?: subsectionProps['format']
}

export function SwatchItem({format = 'both-fit', debug, active = false, color, onClick} : SwatchItemProps) {
    return(
        <SubSection
            format={format}
            debug={debug}
            type='button'
            className="hover:scale-105 transition-all duration-300 group px-1"
            onClick={onClick}
        >
            <span 
                className={` h-8 w-8 rounded-full group-hover:ring-4 group-hover:ring-slate-900 ${active ? 'ring-4 ring-slate-900' : ''}`} 
                style={{background: color}}
            />
        </SubSection>
    )
} 

interface ColorSwatchSelectorProps extends subsectionProps {
    children: ReactNode
    onChangeColor: (color: HexColor) => void,
    title?: string     
}

export function ColorSwatchSelector({format, debug, children, onChangeColor, title} : ColorSwatchSelectorProps) {
    const [ selectedColor, setSelectedColor ] = useState<HexColor>();
    const [ selectedItemIndex, setSelectedItemIndex ] = useState<number | null>(null);

    return(
        <SubSection
            format={format}
            debug={debug}
            className="flex-col p-2"
        >
            {title && 
                <span
                    className="text-lg font-semibold text-gray-800 mb-1"
                >{title}</span>
            }
            <div className="grid grid-cols-7 gap-1">
                {Children.map(children, (child, index) => {
                    if(!isValidElement<SwatchItemProps | ColorSwatchSelectorProps>(child)){
                        throw new Error('ColorSwatchSelector only accept SwatchItem component')
                    }

                    const item = child as ReactElement<SwatchItemProps | CustomColorPickerButtonProps>;
                    const active = selectedItemIndex === null
                        ? item.props.active
                        : selectedItemIndex === index;
                    const sharedProps = {
                        active,
                        format,
                        debug,
                    };

                    if (item.type === CustomColorPickerButton) {
                        return cloneElement(item, {
                            ...sharedProps,
                            color: selectedColor ?? item.props.color,
                            onChange: (color: HexColor) => {
                                setSelectedColor(color);
                                setSelectedItemIndex(index);
                                onChangeColor(color);
                                item.props.onChange?.(color);
                            },
                        });
                    }

                    return cloneElement(item, {
                        ...sharedProps,
                        onClick: () => {
                            const color = item.props.color;
                            if (!color) return;

                            setSelectedColor(color);
                            setSelectedItemIndex(index);
                            item.props.onClick?.();
                            onChangeColor(color);
                        },
                    })
                })}
            </div>
            
        </SubSection>
    )
}