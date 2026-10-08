import type { ApiIncidente } from "../../../../types/api-types";
import type { HexColor, subsectionProps } from "../../../../types/utils-types";
import SubSection from "../../PanelComponents/primitive-components/SubSection";
import { FiUpload } from "react-icons/fi";
import Input from "../Input";
import { ColorSwatchSelector, CustomColorPickerButton, SwatchItem } from "../ColorSwatchSelector";
import { useState, useEffect } from "react";
import { CreateTagButton, Tag, TagPicker } from "../TagPicker";

interface CategoryFormProp extends subsectionProps {
    category?: ApiIncidente | null
}

export default function CategoryForm({format, debug, category} : CategoryFormProp) {
    const [ selectedColor, setSelectedColor ] = useState<HexColor | null>(`#066ed6`)

    useEffect(() => {
        if(category)
            setSelectedColor(null);
        else
            setSelectedColor(`#066ed6`);
    }, [category])

    return (
        <SubSection
            format={format}
            debug={debug}
            className="
                flex-col items-start 
                justify-center bg-gray-100 rounded-xl p-2
                
            "
        >  
            <div className="flex flex-row gap-2 items-center justify-center">
                {category ? 
                    <span
                        className="w-12 h-12 rounded-full"
                        style={{background: !selectedColor ? category.color : selectedColor}}
                    /> 
                : 
                    <>
                        <input 
                            id="uploadCategoryImage"
                            className="hidden"
                            type='file'
                        />
                        <label
                            htmlFor="uploadCategoryImage"
                            className="
                                w-12 h-12 border-2  
                                border-white rounded-full flex items-center 
                                justify-center
                                group
                            "
                            style={{background: selectedColor ? selectedColor : `#066ed6`}}
                        >
                            <FiUpload className="text-2xl text-white group-hover:scale-120 transition-all duration-300"/>
                        </label>
                    </>
                }
                <div className="flex flex-col">
                    <span
                        className="text-lg font-bold whitespace-nowrap text-gray-700"
                    >{category ? "Editar categoria" : "Nueva categoria"}</span>
                    <span 
                        className="
                            whitespace-nowrap font-medium 
                            text-gray-500
                        "
                    >Aparecera en la app al crearla</span>
                </div>
            </div>
            <ColorSwatchSelector
                format='row'
                onChangeColor={(color) => setSelectedColor(color)}
                title="Color en el mapa"
            >
                <SwatchItem
                    color="#ad00f1"
                    active
                />
                <SwatchItem
                    color="#066ed6"
                />
                <CustomColorPickerButton
                />
            </ColorSwatchSelector>
            <Input
                type='text'
                name="Nombre"
                format='col'
                label="Nombre"
            />
            <TagPicker
                format={format}
                title="Etiquetas sugeridas"
            >
                {category && category.tags && category?.tags.map((tag) => 
                    <Tag
                        key={tag.id}
                        name={tag.nombre}
                        badge={tag.peso}
                        color={category?.color as HexColor}
                    />
                )}
                <CreateTagButton
                    
                />
            </TagPicker>
        </SubSection>   
    )
}