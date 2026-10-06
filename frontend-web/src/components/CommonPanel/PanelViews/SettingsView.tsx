import { FiLayers } from "react-icons/fi";
import ColSection from "../PanelComponents/primitive-components/ColSection";
import RowSection from "../PanelComponents/primitive-components/RowSection";
import { SideNav, SideNavItem } from "../view-components/SideNav";
import { useState, type ReactNode } from "react";
import { LuShieldCheck } from "react-icons/lu";
import SubsectionTitle from "../view-components/SubsectionTitle";
import Button from "../view-components/Button";
import { BiPlus } from "react-icons/bi";
import { Checkbox, SimpleStatistics, SimpleText, Table, TdButton, TdItemsWrapped, TRow } from "../view-components/Tables";
import { GoPencil } from "react-icons/go";
import type { ApiIncidente } from "../../../types/db-types";

function CategoriesSection() {
    const [categories, setCategories ] = useState<ApiIncidente[]>([])
    const [ categoryActive, setCategoryActive ] = useState(true);

    return(
        <ColSection>
            <RowSection
                className="h-fit gap-10"
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
                />
            </RowSection>
            <RowSection>
                <Table
                    format="col"
                    debug={true}
                    headers={[
                        {
                            title: 'Categoria',
                        },
                        {
                            title: 'Etiquetas'
                        },
                        {
                            title: 'Peso'
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
                        <TRow>
                            <SimpleText
                                text={c.nombre}
                            />
                            <SimpleStatistics
                                statistics={c.tags.length}
                            />
                            <SimpleStatistics
                                statistics={}
                            />
                            <SimpleStatistics
                                statistics="412"
                            />
                            <TdItemsWrapped
                                className="flex flex-row items-center justify-end p-2"
                            >
                                <Checkbox
                                    name="inundacion-activa"
                                    value={categoryActive}
                                    onChange={(event) => setCategoryActive(event.currentTarget.checked)}
                                />
                                <TdButton
                                    content={{
                                        icon: <GoPencil/>,
                                    }}
                                />
                            </TdItemsWrapped>
                        </TRow>)
                    }
                </Table>

            </RowSection>
        </ColSection>
    )
}


export default function SettingView () {
    const [ secSelected, setSecSelected ] = useState<ReactNode>(<CategoriesSection/>);
    
    const SideNavItems = [
        {
            title: "Categorias",
            icon: <FiLayers/>,
        },
        {
            title: "Roles y permisos",
            icon: <LuShieldCheck/>
        }
    ]

    return(
        <RowSection
            title="Ajustes"
            subtitle="Configuración general del sistema · solo administradores"  
            debug={false}  
            className="h-full"    
        >
            <ColSection
                border={['right']}
            >
                <SideNav 
                    format='col'
                >
                    {SideNavItems.map((item) => 
                        <SideNavItem
                            key={item.title}
                            title={item.title}
                            icon={item.icon}
                            isSelected={item.title === secSelected}
                            onClick={() => setSecSelected(item.title)}
                        />
                    )}
                </SideNav>
            </ColSection>
            {secSelected}
        </RowSection>
    )
}
