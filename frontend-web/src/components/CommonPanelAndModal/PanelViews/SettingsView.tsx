import { FiLayers } from "react-icons/fi";
import ColSection from "../PanelAndModalComponents/primitive-components/ColSection";
import RowSection from "../PanelAndModalComponents/primitive-components/RowSection";
import { SideNav, SideNavItem } from "../PanelAndModalComponents/view-components/SideNav";
import { useState, type ChangeEvent } from "react";
import { LuShieldCheck } from "react-icons/lu";
import SubsectionTitle from "../PanelAndModalComponents/view-components/SubsectionTitle";
import Button from "../PanelAndModalComponents/view-components/Button";
import { BiPlus } from "react-icons/bi";
import { Checkbox, SimpleStatistics, SimpleText, Table, TdButton, TdItemsWrapped, TRow } from "../PanelAndModalComponents/view-components/Tables";
import { GoPencil } from "react-icons/go";
import type { ApiIncidente } from "../../../types/db-types";
import CategoryForm from "../PanelAndModalComponents/view-components/specifics-components/CategoryForm";
import SubSection from "../PanelAndModalComponents/primitive-components/SubSection";

function CategoriesSection() {
    const [categories, setCategories] = useState<ApiIncidente[]>([
        {
            id: 1,
            nombre: "Inundación",
            tiempo_limite: 24,
            radio: 500,
            color: "#1976D2",
            tags: [
                { id: 1, nombre: "encharcamiento", peso: 2 },
                { id: 2, nombre: "corriente fuerte", peso: 3 },
            ],
            esta_activo: true,
        },
        {
            id: 2,
            nombre: "Alumbrado público",
            tiempo_limite: null,
            radio: 300,
            color: "#FBC02D",
            tags: [
                { id: 3, nombre: "apagado", peso: 2 },
                { id: 4, nombre: "intermitente", peso: 1 },
            ],
            esta_activo: true,
        },
        {
            id: 3,
            nombre: "Bache",
            tiempo_limite: null,
            radio: 200,
            color: "#6D4C41",
            tags: [
                { id: 5, nombre: "profundo", peso: 3 },
                { id: 6, nombre: "en avenida", peso: 2 },
                { id: 7, nombre: "con agua", peso: 1 },
            ],
            esta_activo: true,
        },
        {
            id: 4,
            nombre: "Árbol caído",
            tiempo_limite: 48,
            radio: 500,
            color: "#388E3C",
            tags: [
                { id: 8, nombre: "bloquea calle", peso: 3 },
                { id: 9, nombre: "cables afectados", peso: 3 },
            ],
            esta_activo: true,
        },
        {
            id: 5,
            nombre: "Drenaje",
            tiempo_limite: null,
            radio: null,
            color: "#00897B",
            tags: [
                { id: 10, nombre: "fuga", peso: 2 },
                { id: 11, nombre: "mal olor", peso: 1 },
            ],
            esta_activo: false,
        },
    ])
    const [openForm, setOpenForm ] = useState(false);
    const [ selectedCategory, setSelectedCategory ] = useState<ApiIncidente | null >(null);

    const handleChangeIsActive = (e: ChangeEvent<HTMLInputElement>) => {
        setCategories(prev => prev.map(
            (c) => c.id.toString() === e.target.id ? {...c, esta_activo: e.target.checked} : c
        ))

        //change esta_activo in db(send complete incident)
    }

    return(
        <ColSection className="gap-2 overflow-x-auto">
            <RowSection
                className="h-fit gap-10 p-2"
            >
                <SubsectionTitle
                    title="Categorias de incidentes"
                    format='col'
                    description="Lo que el ciudadano puede elegir al reportar · 7 activas, 1 inactiva"
                />
                <Button
                    title="Nueva categoria"
                    color='blue'
                    format='both-fit'
                    icon=<BiPlus/>
                    onClick={() => {
                        setSelectedCategory(null);
                        setOpenForm(true);
                    }}
                />
            </RowSection>
            <RowSection className="gap-2 overflow-x-auto max-w-full min-h-130 items-start">
                <SubSection
                    format={'nothing'}
                    className="overflow-y-auto overflow-x-hidden min-w-150 max-w-180 max-h-120"
                >
                    <Table
                        format='col'
                        headers={[
                            {
                                title: 'Categoria',
                            },
                            {
                                title: 'Etiquetas'
                            },
                            {
                                title: 'Reportes 30 D'
                            },
                            {
                                title: 'Activa'
                            }
                        ]}
                    >
                        {categories.map((c) => 
                            <TRow key={c.id}>
                                <SimpleText
                                    icon={<span className={`inline-block w-7 h-7 rounded-full`} style={{background: c.color}}/>}
                                    text={c.nombre}
                                />
                                <SimpleStatistics
                                    statistics={c.tags.length}
                                />
                                <SimpleStatistics
                                    statistics="N/A"
                                />
                                <TdItemsWrapped
                                    className="flex flex-row items-center justify-end p-2"
                                >
                                    <Checkbox
                                        id={`${c.id}`}
                                        name={c.nombre}
                                        checked={c.esta_activo}
                                        onChange={(e) => handleChangeIsActive(e)}
                                    />
                                    <TdButton
                                        content={{
                                            icon: <GoPencil/>,
                                        }}
                                        onClick={() => {
                                            setSelectedCategory(c)
                                            setOpenForm(true);
                                        }}
                                    />
                                </TdItemsWrapped>
                            </TRow>
                            )
                        }
                    </Table>
                </SubSection>
                {openForm && 
                    <CategoryForm
                        format='col'
                        category={selectedCategory}
                        onClose={() => setOpenForm(false)}
                    />
                }
            </RowSection>
        </ColSection>
    )
}

const SideNavItems = {
    'Categorias' : {
        icon: <FiLayers/>,
        node: <CategoriesSection/>
    },
    'Roles y permisos': {
        icon: <LuShieldCheck/>,
        node: null
    }
}

type nodesName = keyof typeof SideNavItems;

export default function SettingView () {
    const [ secSelected, setSecSelected ] = useState<nodesName>('Categorias');
    const sideNavItems = Object.keys(SideNavItems) as nodesName[];

    return(
        <RowSection
            title="Ajustes"
            subtitle="Configuración general del sistema · solo administradores"  
            debug={false}  
            className="h-full gap-2"    
        >
            <ColSection
                border={['right']}
            >
                <SideNav 
                    format='col'
                >
                    {sideNavItems.map((item) => 
                        <SideNavItem
                            key={item}
                            title={item}
                            icon={SideNavItems[item].icon}
                            isSelected={item === secSelected}
                            onClick={() => setSecSelected(item)}
                        />
                    )}
                </SideNav>
            </ColSection>
            {SideNavItems[secSelected].node}
        </RowSection>
    )
}
