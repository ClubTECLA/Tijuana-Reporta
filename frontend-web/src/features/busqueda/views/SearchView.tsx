import ColSection from "@/components/layout/ColSection";
import SubSection from "@/components/layout/SubSection";
import { ListTile, OptionList } from "@/components/ui/OptionsList";
import { SegmentedTabs, TabItem } from "@/components/ui/SegmentedTabs";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { usePhotonSearch } from "@/lib/usePhotonSearch";
import { FaRegClock } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useLocationPicker } from "@/features/mapa/useLocationPicker";
import { addRecentSearch } from "@/lib/utils";
import { useSysMessage } from "@/components/ui/SysMessageContext";
import type { ApiListarReportesCercanosResponse } from "@/types/api-types";
import { listarReportesCercanos } from "@/features/reportes/reportes.services";
import IncidentRow from "@/features/reportes/components/IncidentRow";

const sectionTitleStyle = "text-body text-ink-muted font-semibold";

export default function SearchView () {
    const [searchStorage, setSearchStorage] = useLocalStorage('Almacenamiento de Busqueda');
    const {suggestions, searchLocations } = usePhotonSearch();
    const [ closeIncidents, setCloseIncidents ] = useState<ApiListarReportesCercanosResponse>([]);
    const { showMessage } = useSysMessage();
    const { search } = useLocationPicker();
    console.log('suggestions: ', suggestions, "\nIncidents: ", closeIncidents);

    const handleSelectLocation = async (query: string) => {
        try {
            const result = await search(query);
            if (result !== "ignored") addRecentSearch(query);

            if (result === "not-found") {
                showMessage("No encontramos esa dirección en Tijuana.", { color: "yellow", type: "float", title: "Ubicación" });
            }
            
        } catch {
            showMessage("No se pudo buscar la dirección. Intenta de nuevo.", { color: "red", type: "float", title: "Ubicación" });        
        }
    };

    useEffect(() => {
        if(suggestions.length === 0) return;
        
        const relevantLocation = suggestions[0].geometry;
        
        listarReportesCercanos({
            'lat': relevantLocation.coordinates[1],
            'lng': relevantLocation.coordinates[0],
            'radio': 500
        })
        .then(setCloseIncidents)
    }, [suggestions]);

    useEffect(() => {
        // El hook ya registra el error en su estado `error`; se evita la
        // promesa rechazada sin manejar que antes aparecía en consola.
        searchLocations(searchStorage.current_query).catch(() => {});
    }, [searchStorage.current_query])

    return (
        <ColSection className="min-h-0 gap-7">
            <SegmentedTabs format='row'>
                <TabItem
                    tabTitle="Todo"
                    isActive
                />
                <TabItem
                    tabTitle="Incidentes"
                />
                <TabItem
                    tabTitle="Lugares"
                />
            </SegmentedTabs>

            <div className="flex min-h-0 w-full flex-1 flex-col gap-4 font-ui sm:w-[max(25rem,calc(25vw-2rem))]">
                {suggestions.length !== 0 && 
                    <OptionList
                        format='col'
                        title="LUGARES"
                    >
                        {suggestions.map((s) => 
                            <ListTile
                                tileName={(s.properties.name as string)}
                                tileDescription={`${s.properties.type} · ${s.properties.county}`}
                                onClick={() => handleSelectLocation((s.properties.name as string))}
                            />
                        )}
                    </OptionList>
                }

                <SubSection className="flex-col items-start justify-start gap-2" format="col">
                    <SubSection as='span' className={sectionTitleStyle}>INCIDENTES Y REPORTES</SubSection>
                    {closeIncidents.map((i) => 
                        <IncidentRow
                            reporte={i}
                        />
                    )}
                </SubSection>

                <SubSection className="flex-col items-start justify-start gap-2" format="col">
                    <SubSection as='span' className={sectionTitleStyle}>BÚSQUEDAS RECIENTES</SubSection>
                    {searchStorage.recent_searches.length === 0
                        ? <span className="py-3 text-caption text-ink-muted">No hay búsquedas recientes.</span>
                        : searchStorage.recent_searches.map((query) =>
                            <SubSection
                                as='button'
                                key={query}
                                onClick={() => setSearchStorage((prev) => ({
                                    ...prev,
                                    'selected_recent_search': query,
                                    'current_query': query,
                                }))}
                                className="w-full flex-row items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-left text-body text-ink-secondary transition-colors hover:bg-subtle focus-visible:outline-2 focus-visible:outline-brand"
                            >
                                <FaRegClock className="shrink-0 text-ink-muted " aria-hidden="true" />
                                <SubSection as='span' className="min-w-0 truncate">{query}</SubSection>
                            </SubSection>
                        )
                    }
                </SubSection>
            </div>

        </ColSection>
    );
}