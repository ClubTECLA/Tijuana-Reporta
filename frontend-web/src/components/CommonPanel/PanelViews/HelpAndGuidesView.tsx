import SearchBar from '../PanelComponents/view-components/SearchBar';
import ColSection from '../PanelComponents/primitive-components/ColSection';
import { ListTile, OptionList } from '../PanelComponents/view-components/OptionsList';
import { HiOutlineDocumentReport, HiOutlinePaperAirplane } from 'react-icons/hi';
import { MdOutlineReportProblem } from 'react-icons/md';
import { FiFlag } from 'react-icons/fi';
import { LuUsersRound } from 'react-icons/lu';


const GuiasItems = [
    {
        tileName: "Revisar reportes duplicados",
        onClick: () => {},
        icon: <HiOutlineDocumentReport/>
    },
    {
        tileName: "Verificar y cerrar incidentes",
        icon: <MdOutlineReportProblem/>,
        onClick: () => {}
    },
    {
        tileName: "Enviar avisos a la poblacion",
        icon: <HiOutlinePaperAirplane/>,
        onClick: () => {}
    },
    {
        tileName: "Moderar contenido y cuentas",
        icon: <FiFlag/>,
        onClick: () => {}
    },
    {
        tileName: "Roles y permisos del equipo",
        icon: <LuUsersRound/>,
        onClick: () => {}
    }
]

export default function HelpAndGuidesView() {
    return (
        <ColSection
            arrangementSubsections="toDown"
            title="Ayuda y guías"
            subtitle="Respuestas rápidas para el equipo"
            footerText="Tijuana Reporta · consola v1.0 · sep 2026"
        >
            <SearchBar
                format='col'
                placeholder='Buscar en la ayuda'
            />
            <OptionList
                format='col'
                title='Guias'
            >
                {GuiasItems.map((item, index) => (
                    <ListTile
                        key={index}
                        tileName={item.tileName}
                        onClick={item.onClick}
                        icon={item.icon}
                    />
                ))}
            </OptionList>
        </ColSection>
    );
}