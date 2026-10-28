import { FiLayers } from "react-icons/fi";
import ColSection from "../PanelAndModalComponents/primitive-components/ColSection";
import RowSection from "../PanelAndModalComponents/primitive-components/RowSection";
import { SideNav, SideNavItem } from "../PanelAndModalComponents/view-components/SideNav";
import { useEffect, useState, type ChangeEvent } from "react";
import { LuShieldCheck } from "react-icons/lu";
import SubsectionTitle from "../PanelAndModalComponents/view-components/SubsectionTitle";
import Button from "../PanelAndModalComponents/view-components/Button";
import { BiPlus } from "react-icons/bi";
import { Checkbox, SimpleStatistics, SimpleText, Table, TdButton, TdItemsWrapped, TRow } from "../PanelAndModalComponents/view-components/Tables";
import { GoPencil } from "react-icons/go";
import type { ApiIncidente } from "../../../types/api-types";
import CategoryForm from "../PanelAndModalComponents/view-components/specifics-components/CategoryForm";
import SubSection from "../PanelAndModalComponents/primitive-components/SubSection";
import type { subsectionProps } from "../../../types/utils-types";
import { listarIncidentes } from "../../../services/incidentes.services";
import { useSysMessage } from "../../../hooks/contexts/SysMessageContext";

function CategoriesSection({debug} : subsectionProps) {
    const { showMessage } = useSysMessage();
    const [categories, setCategories] = useState<ApiIncidente[]>([]);
    const [openForm, setOpenForm ] = useState(false);
    const [ selectedCategory, setSelectedCategory ] = useState<ApiIncidente | null >(null);
    const [ loadCategories, setLoadCategories ] = useState(true);

    useEffect(() => {
        if(!loadCategories) return;
        const fetchCategories = async () => {
            try{
                const res = await listarIncidentes({ incluir_inactivos: true });
                setCategories(res);
            }catch(err){
                console.error(err);
                showMessage("Error al cargar las categorias",{'color': 'red', 'showTime': 3000, 'title': 'Error'});
            }
        }
        fetchCategories()
        .finally(() => setLoadCategories(false));
    }, [loadCategories]);

    const handleChangeIsActive = (e: ChangeEvent<HTMLInputElement>) => {
        setCategories(prev => prev.map(
            (c) => c.id.toString() === e.target.id ? {...c, esta_activo: e.target.checked} : c
        ))

        //change esta_activo in db(send complete incident)
    }

    return(
        <ColSection className="min-w-0 w-full gap-2"
            debug={debug}
        >
            <RowSection
                className="h-fit items-center justify-between gap-3 p-2"
            >
                <SubsectionTitle
                    title="Categorias de incidentes"
                    format='col'
                    description="Lo que el ciudadano puede elegir al reportar · 7 activas, 1 inactiva"
                />
                <Button
                    title="Nueva categoria"
                    variant="primary"
                    format='both-fit'
                    icon=<BiPlus/>
                    onClick={() => {
                        setSelectedCategory(null);
                        setOpenForm(true);
                    }}
                />
            </RowSection>
            <RowSection className="min-h-0 min-w-0 max-w-full flex-col items-stretch gap-2 overflow-y-auto sm:min-h-130 sm:flex-row sm:items-start sm:overflow-x-auto">
                <SubSection
                    format={'nothing'}
                    className="max-h-120 min-w-0 w-full overflow-y-auto overflow-x-hidden min-w-150"
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
                        onCreateCategory={() => setLoadCategories(true)}
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
            className="h-full min-h-0 min-w-0 gap-2 max-sm:flex-col"
        >
            <ColSection
                border={['right']}
                className="max-sm:border-r-0 max-sm:border-b-2 h-full"
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
