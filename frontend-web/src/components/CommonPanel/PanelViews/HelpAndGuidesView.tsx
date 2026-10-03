import SearchBar from '../view-components/SearchBar';
import ColSection from '../PanelComponents/primitive-components/ColSection';
import { ListTile, OptionList } from '../view-components/OptionsList';
import { HiOutlineDocumentReport, HiOutlinePaperAirplane } from 'react-icons/hi';
import { MdOutlineReportProblem } from 'react-icons/md';
import { FiFlag } from 'react-icons/fi';
import { LuUsersRound } from 'react-icons/lu';

export default function HelpAndGuidesView() {
    return (
        <ColSection
            arrangementSubsections="toDown"
            title="Ayuda y guías"
            subtitle="Respuestas rápidas para el equipo"
        >
            <SearchBar
                format='col'
                placeholder='Buscar en la ayuda'
            />
            <OptionList
                format='col'
            >
                <ListTile
                    tileName="Revisar reportes duplicados"                
                    onClick={() => {}}
                    icon={<HiOutlineDocumentReport/>}
                />
                <ListTile
                    tileName="Verificar y cerrar incidentes"
                    icon={<MdOutlineReportProblem/>}
                    onClick={() => {}}
                />
                <ListTile
                    tileName="Enviar avisos a la poblacion"
                    icon={<HiOutlinePaperAirplane/>}
                    onClick={() => {}}
                />
                <ListTile
                    tileName="Moderar contenido y cuentas"
                    icon={<FiFlag/>}
                    onClick={() => {}}
                />
                <ListTile
                    tileName="Roles y permisos del equipo"
                    icon={<LuUsersRound/>}
                    onClick={() => {}}
                />
            </OptionList>
        </ColSection>
    );
}