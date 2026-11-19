import type { ApiActualizarIncidenteRequest, ApiCrearIncidenteRequest, ApiIncidente } from "@/types/api-types";
import type { HexColor, subsectionProps } from "@/types/utils-types";
import SubSection from "@/components/layout/SubSection";
import { FiPlus, FiUpload } from "react-icons/fi";
import Input from "@/components/ui/Input";
import { ColorSwatchSelector, CustomColorPickerButton, SwatchItem } from "@/components/ui/ColorSwatchSelector";
import { useState, type ChangeEvent } from "react";
import { CreateTagButton, Tag, TagPicker } from "@/components/ui/TagPicker";
import Button from "@/components/ui/Button";
import { useSysMessage, SysMessage } from "@/components/ui/SysMessageContext";
import { actualizarIncidente, crearIncidente } from "@/features/categorias/incidentes.services";

interface CategoryFormProp extends subsectionProps {
    category?: ApiIncidente | null
    onClose?: () => void
    onSaveCategory?: () => void
}

export default function CategoryForm({format, debug, category, onClose, onSaveCategory } : CategoryFormProp) {
    const {showMessage} = useSysMessage();
    const isEdit = !!category;
    const [ submitting, setSubmitting ] = useState(false);
    const [ categoryForEdit, setCategoryForEdit] = useState<ApiIncidente>(
        () => category ?? {
                id: 0,
                nombre: "",
                etiqueta: "",
                color: '#066ed6',
                tiempo_limite: 0,
                radio: 0,
                tags: [],
                esta_activo: false
            },
    );

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

    const handleSubmitForm = async () => {
        const nombre = categoryForEdit.nombre.trim();
        if(nombre === ""){
            showMessage("Es necesario que ingreses un nombre para la categoria", {'color': 'red', 'showTime': 3000, 'type': 'inline'});
            return;
        }
        if (nombre.length > 100) {
            showMessage("El nombre debe tener máximo 100 caracteres", {'color': 'red', 'showTime': 3000, 'type': 'inline'});
            return;
        }
        if (categoryForEdit.radio != null && (!Number.isFinite(categoryForEdit.radio) || categoryForEdit.radio < 0)) {
            showMessage("El radio debe ser un número mayor o igual a 0", {'color': 'red', 'showTime': 3000, 'type': 'inline'});
            return;
        }

        const tags = categoryForEdit.tags.map(({ nombre: tagName, peso }) => ({
            nombre: tagName.trim(),
            peso
        }));
        const tagNames = tags.map(({ nombre: tagName }) => tagName.toLowerCase());
        if (
            !isEdit &&
            (
                tags.some(({ nombre: tagName }) => tagName === "") ||
                new Set(tagNames).size !== tagNames.length
            )
        ) {
            showMessage("Las etiquetas deben tener nombres únicos y no vacíos", {'color': 'red', 'showTime': 3000, 'type': 'inline'});
            return;
        }

        const incidentRequest: ApiCrearIncidenteRequest = {
            nombre,
            etiqueta: categoryForEdit.etiqueta.length === 0 ? undefined : (categoryForEdit.etiqueta[0].toUpperCase() + categoryForEdit.etiqueta.slice(1).toLowerCase()),
            tiempo_limite: categoryForEdit.tiempo_limite ?? undefined,
            radio: categoryForEdit.radio ?? undefined,
            esta_activo: isEdit ? categoryForEdit.esta_activo : true,
            color: categoryForEdit.color,
            tags
        };

        setSubmitting(true);
        try {
            if (isEdit) {
                const updateRequest: ApiActualizarIncidenteRequest = {
                    nombre,
                    etiqueta: categoryForEdit.etiqueta.trim() || nombre,
                    tiempo_limite: categoryForEdit.tiempo_limite,
                    radio: categoryForEdit.radio,
                    color: categoryForEdit.color,
                    esta_activo: categoryForEdit.esta_activo,
                };
                await actualizarIncidente(categoryForEdit.id, updateRequest);
            } else {
                await crearIncidente(incidentRequest);
            }

            showMessage(
                isEdit ? "Categoría editada exitosamente." : "Categoría de incidente creada exitosamente.",
                {'color': 'green', 'showTime': 3000, 'type': 'float'}
            );
            onSaveCategory?.();
            onClose?.();
        } catch (error) {
            console.error(isEdit ? "Error al actualizar incidente:" : "Error al crear incidente:", error);
            showMessage(
                isEdit ? "Error al editar la categoría." : "Error al crear la categoría.",
                {'color': 'red', 'showTime': 3000, 'type': 'inline'}
            );
            return;
        } finally {
            setSubmitting(false);
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
                max-w-100 min-w-70
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
                                border-surface rounded-full flex items-center
                                justify-center
                                group
                            "
                            style={{background: categoryForEdit.color}}
                        >
                            <FiUpload className="text-2xl text-surface group-hover:scale-120 transition-all duration-300"/>
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
                onCreateTag={isEdit ? undefined : handleAddTag}
            >
                {categoryForEdit.tags.map((tag) =>
                    <Tag
                        key={tag.id}
                        value={tag.nombre}
                        badge={tag.peso}
                        color={categoryForEdit.color as HexColor}
                        readOnly={isEdit}
                        onChangeValue={isEdit ? undefined : (event) => {
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
                        onChangeBadge={isEdit ? undefined : (event) => {
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
                        onRemove={isEdit ? undefined : () => handleRemoveTag(tag.id)}
                    />
                )}
                {!isEdit && <CreateTagButton />}
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