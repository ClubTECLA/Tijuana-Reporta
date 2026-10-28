import type { ApiCrearIncidenteRequest, ApiIncidente } from "../../../../../types/api-types";
import type { HexColor, subsectionProps } from "../../../../../types/utils-types";
import SubSection from "../../primitive-components/SubSection";
import { FiPlus, FiUpload } from "react-icons/fi";
import Input from "../Input";
import { ColorSwatchSelector, CustomColorPickerButton, SwatchItem } from "../ColorSwatchSelector";
import { useState, useEffect, type ChangeEvent } from "react";
import { CreateTagButton, Tag, TagPicker } from "../TagPicker";
import Button from "../Button";
import { useSysMessage, SysMessage } from "../../../../../hooks/contexts/SysMessageContext";
import { createIncident } from "../../../../../services/incidents.services";

interface CategoryFormProp extends subsectionProps {
    category?: ApiIncidente | null
    onClose?: () => void
    onCreateCategory?: () => void
}

export default function CategoryForm({format, debug, category, onClose, onCreateCategory } : CategoryFormProp) {
    const {showMessage} = useSysMessage();
    const isEdit = !!category;
    const [ submitting, setSubmitting ] = useState(false);
    const [ categoryForEdit, setCategoryForEdit] = useState<ApiIncidente>({
        id: 0,
        nombre: "",
        etiqueta: "",
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
                etiqueta: "",
                color: '#066ed6',
                tiempo_limite: 0,
                radio: 0,
                tags: [],
                esta_activo: false
            })
            
        }
    }, [category])

    const handleChangeInputs = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        setCategoryForEdit(prev => ({
            ...prev,
            [name]: name === 'radio'
                ? value === '' ? null : Number(value)
                : value,
        }))
    }

    const handleAddTag = (value: string, badge?: number) => {
        const nombre = value.trim();
        if(categoryForEdit.tags.some(tag => tag.nombre.toLowerCase() === nombre.toLowerCase())){
            showMessage("Ya existe una etiqueta con ese nombre", {'color': 'red', 'showTime': 3000, 'type': 'float'});
            return;
        }
        setCategoryForEdit((previousCategory) => ({
            ...previousCategory,
            tags: [
                ...previousCategory.tags,
                {
                    id: Math.max(0, ...previousCategory.tags.map((tag) => tag.id)) + 1,
                    nombre,
                    peso: badge ?? 1
                }
            ]
        }));
    }

    const handleSubmitForm = () => {
        if(categoryForEdit.nombre === ""){
            showMessage("Es necesario que ingreses un nombre para la categoria", {'color': 'red', 'showTime': 3000, 'type': 'inline'});
            return;
        }
        try{

            const tags = categoryForEdit.tags.map(({ nombre, peso }) => ({
                nombre: nombre.trim(),
                peso
            }));
            const tagNames = tags.map(({ nombre }) => nombre.toLowerCase());
            if (
                tags.some(({ nombre }) => nombre === "") ||
                new Set(tagNames).size !== tagNames.length
            ) {
                showMessage("Las etiquetas deben tener nombres únicos y no vacíos", {'color': 'red', 'showTime': 3000, 'type': 'inline'});
                return;
            }

            const incidentRequest: ApiCrearIncidenteRequest = {
                nombre: categoryForEdit.nombre,
                etiqueta: categoryForEdit.etiqueta.length === 0 ? undefined : (categoryForEdit.etiqueta[0].toUpperCase() + categoryForEdit.etiqueta.slice(1).toLowerCase()),
                tiempo_limite: categoryForEdit.tiempo_limite ?? undefined,
                radio: categoryForEdit.radio ?? undefined,
                esta_activo: isEdit ? categoryForEdit.esta_activo : true,
                color: categoryForEdit.color,
                tags
            };

            if(!isEdit){
                setSubmitting(true);
                createIncident(incidentRequest)
                .then(() => {
                    showMessage(
                        isEdit ? "Categoria editada exitosamente!!" :
                        "Categoria de incidente creada exitosamente!!",
                        {'color': 'green', 'showTime': 3000, 'type': 'float'});
                    onCreateCategory?.();
                    onClose?.();
                })
                .catch((err) => {
                    console.log('Error al crear incidente: ', err);
                    showMessage(
                        isEdit ? 
                        "Error al editar la categoria" : 
                        "Error al crear categoria", 
                        {'color': 'red', 'showTime': 3000, 'type': 'inline'}
                    );
                })
                .finally(() => {
                    setSubmitting(false);
                });
                
            }else{

            }
        }catch(err){
            console.log('Error al crear incidente: ', err);
            showMessage(
                isEdit ? 
                "Error al editar la categoria" : 
                "Error al crear categoria", 
                {'color': 'red', 'showTime': 3000, 'type': 'inline'}
            );
        }
    }

    const handleRemoveTag = (tagId: number) => {
        setCategoryForEdit((previousCategory) => ({
            ...previousCategory,
            tags: previousCategory.tags.filter((tag) => tag.id !== tagId)
        }));
    }

    return (
        <SubSection
            format={format}
            debug={debug}
            className="
                flex-col items-start 
                justify-center bg-subtle rounded-xl px-2 py-4
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
                        className="text-lg font-bold whitespace-nowrap text-ink"
                    >{category ? "Editar categoria" : "Nueva categoria"}</span>
                    <span 
                        className="
                            whitespace-nowrap font-medium 
                            text-ink-muted
                        "
                    >Aparecera en la app al crearla</span>
                </div>
            </div>
            <SysMessage/>
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
                name="nombre"
                format='col'
                label="Nombre"
                value={categoryForEdit.nombre}
                onChange={handleChangeInputs}
            />
            <TagPicker
                format={format}
                title="Etiquetas sugeridas"
                onCreateTag={handleAddTag}
            >
                {categoryForEdit.tags.map((tag) => 
                    <Tag
                        key={tag.id}
                        value={tag.nombre}
                        badge={tag.peso}
                        color={categoryForEdit.color as HexColor}
                        onChangeValue={(event) => {
                            const nombre = event.currentTarget.value;
                            setCategoryForEdit((previous) => ({
                                ...previous,
                                tags: previous.tags.map((previousTag) => (
                                    previousTag.id === tag.id
                                        ? { ...previousTag, nombre }
                                        : previousTag
                                ))
                            }));
                        }}
                        onChangeBadge={(event) => {
                            const peso = event.currentTarget.valueAsNumber;
                            if (!Number.isInteger(peso) || peso < 1) return;

                            setCategoryForEdit((previous) => ({
                                ...previous,
                                tags: previous.tags.map((previousTag) => (
                                    previousTag.id === tag.id
                                        ? { ...previousTag, peso }
                                        : previousTag
                                ))
                            }));
                        }}
                        onRemove={() => handleRemoveTag(tag.id)}
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
                value={categoryForEdit.radio ?? ""}
                onChange={handleChangeInputs}
                name='radio'
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
                    variant="primary"
                    icon={isEdit ? null : <FiPlus/>}
                    title={isEdit ? "Aceptar" : "Crear Categoria"}
                    disabled={submitting}
                    onClick={handleSubmitForm}
                />
            </SubSection>
        </SubSection>   
    )
}