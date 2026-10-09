import type { ApiIncidente } from "../../../../../types/api-types";
import type { HexColor, subsectionProps } from "../../../../../types/utils-types";
import SubSection from "../../primitive-components/SubSection";
import { FiPlus, FiUpload } from "react-icons/fi";
import Input from "../Input";
import { ColorSwatchSelector, CustomColorPickerButton, SwatchItem } from "../ColorSwatchSelector";
import { useState, useEffect, type ChangeEvent } from "react";
import { CreateTagButton, Tag, TagPicker } from "../TagPicker";
import Button from "../Button";
import { useSysMessage } from "../../../../../hooks/contexts/SysMessageContext";

interface CategoryFormProp extends subsectionProps {
    category?: ApiIncidente | null
    onClose?: () => void
}

export default function CategoryForm({format, debug, category, onClose } : CategoryFormProp) {
    const {showMessage} = useSysMessage();
    const [ categoryForEdit, setCategoryForEdit] = useState<ApiIncidente>({
        id: 0,
        nombre: "",
        color: '#066ed6',
        tiempo_limite: 0,
        radio: 0,
        tags: [],
        esta_activo: false
    })

    useEffect(() => {
        if(category)
            setCategoryForEdit(category);
        else{
            setCategoryForEdit({
                id: 0,
                nombre: "",
                color: '#066ed6',
                tiempo_limite: 0,
                radio: 0,
                tags: [],
                esta_activo: false
            })
            
        }
    }, [category])

    const handleChangeCatName = (e: ChangeEvent<HTMLInputElement>) => {
        setCategoryForEdit({...categoryForEdit, 'nombre': e.target.value})
    }

    const handleSubmitForm = () => {
        if(categoryForEdit.nombre === ""){
            showMessage("Es necesario que ingreses un nombre para la categoria", {'color': 'red', 'showTime': 3000, 'type': 'float'});
            return;
        }
        //edit or created incident in db whith fetch

        showMessage("Categoria de incidente creada exitosamente!!", {'color': 'green', 'showTime': 3000, 'type': 'float'});
        onClose?.()
    }

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
                        style={{background: categoryForEdit.color}}
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
                            style={{background: categoryForEdit.color}}
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
                onChangeColor={(color) => setCategoryForEdit({...categoryForEdit, color: color})}
                title="Color en el mapa"
            >
                <SwatchItem
                    color="#f17d00"
                />
                <SwatchItem
                    color="#066ed6"
                />
                <SwatchItem
                    color="#713909"
                />
                <SwatchItem
                    color="#066ed6"
                />
                <SwatchItem
                    color="#15863d"
                />
                <SwatchItem
                    color="#cde434"
                />
                <CustomColorPickerButton
                />
            </ColorSwatchSelector>
            <Input
                type='text'
                name="Nombre"
                format='col'
                label="Nombre"
                value={categoryForEdit.nombre}
                onChange={handleChangeCatName}
            />
            <TagPicker
                format={format}
                title="Etiquetas sugeridas"
            >
                {categoryForEdit.tags.map((tag) => 
                    <Tag
                        key={tag.id}
                        name={tag.nombre}
                        badge={tag.peso}
                        color={categoryForEdit.color as HexColor}
                    />
                )}
                <CreateTagButton
                    
                />
            </TagPicker>
            <Input
                format={format}
                label="Radio(metros)"
                suffix="metros"
                labelPosition='left'
                description="Radio visual de la categoria del incidente."
            />
            <SubSection
                format={format}
                className="flex-row gap-2 justify-end"
            >
                <Button
                    title="cancelar"
                    onClick={onClose}
                />
                <Button
                    color='blue'
                    icon={<FiPlus/>}
                    title="Crear Categoria"
                    onClick={handleSubmitForm}
                />
            </SubSection>
        </SubSection>   
    )
}