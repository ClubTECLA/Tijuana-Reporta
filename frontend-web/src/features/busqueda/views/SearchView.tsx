import ColSection from "@/components/layout/ColSection";
import SubSection from "@/components/layout/SubSection";
import { ListTile, OptionList } from "@/components/ui/OptionsList";
import LoadingIcon from "@/components/ui/LoadingIcon";
import { SegmentedTabs, TabItem } from "@/components/ui/SegmentedTabs";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { usePhotonSearch } from "@/lib/usePhotonSearch";
import { FaRegClock } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useLocationPicker } from "@/features/mapa/useLocationPicker";
import { addRecentSearch, traducirTipoPhoton } from "@/lib/utils";
import { OPEN_STATUSES } from "@/features/reportes/reportFilters";
import type { ApiListarReportesCercanosResponse } from "@/types/api-types";
import { listarReportesCercanos } from "@/features/reportes/reportes.services";
import IncidentRow from "@/features/reportes/components/IncidentRow";
import { useReportes } from "@/features/reportes/useReportes";
import { useCommonPanel } from "@/panels/useCommonPanel";

const sectionTitleStyle = "text-body text-ink-muted font-semibold";
const SLOW_LOCATION_SEARCH_MS = 1_000;

export default function SearchView () {
    const { openPanel } = useCommonPanel();
    const { categories } = useReportes();
    const [searchStorage, setSearchStorage] = useLocalStorage('Almacenamiento de Busqueda');
    const {suggestions, isLoading, error, searchRequestId, searchLocations, clearSearch } = usePhotonSearch();
    const [ incidentLookup, setIncidentLookup ] = useState<{
        suggestions: typeof suggestions;
        reportsBySuggestion: ApiListarReportesCercanosResponse[];
        failedBySuggestion: boolean[];
        error: Error | null;
    } | null>(null);
    const { searchCoordinates } = useLocationPicker();
    const [ tab, setTab ] = useState<"all" | "incidents" | "locations">("all");
    const [ timedOutSearchRequestId, setTimedOutSearchRequestId ] = useState<number | null>(null);
    
    const currentIncidentLookup = incidentLookup?.suggestions === suggestions ? incidentLookup : null;
    
    const closeIncidents = [...new Map(
        (currentIncidentLookup?.reportsBySuggestion.flat() ?? []).map((report) => [report.id, report] as const)
    ).values()];
    
    const isLoadingIncidents = suggestions.slice(0, 3).length > 0 && currentIncidentLookup === null;
    const slowSearchElapsed = timedOutSearchRequestId === searchRequestId;
    const hasLocationQuery = searchStorage.current_query.trim().length > 0;

    const handleSelectLocation = (query: string, latitude: number, longitude: number) => {
        addRecentSearch(query, setSearchStorage);
        searchCoordinates({ latitude, longitude });
    };

    useEffect(() => {
        if (suggestions.length === 0) return;

        let isCurrentLookup = true;
        const firstSuggestions = suggestions.slice(0, 3);

        Promise.allSettled(firstSuggestions.map((suggestion) => {
            const [longitude, latitude] = suggestion.geometry.coordinates;
            return listarReportesCercanos({
                lat: latitude,
                lng: longitude,
                radio: 500,
                estado: OPEN_STATUSES,
            });
        }))
        .then((results) => {
            if (!isCurrentLookup) return;

            const failedResult = results.find(
                (result): result is PromiseRejectedResult => result.status === "rejected",
            );
            const reportsBySuggestion = results.map((result) =>
                result.status === "fulfilled" ? result.value : [],
            );
            const failedBySuggestion = results.map((result) => result.status === "rejected");
            const lookupError = failedResult
                ? failedResult.reason instanceof Error
                    ? failedResult.reason
                    : new Error("No se pudieron cargar los incidentes cercanos.", { cause: failedResult.reason })
                : null;

            setIncidentLookup({
                suggestions,
                reportsBySuggestion,
                failedBySuggestion,
                error: lookupError,
            });
        });

        return () => { isCurrentLookup = false };
    }, [suggestions]);

    useEffect(() => {
        if (!searchStorage.current_query) {
            clearSearch();
            return;
        }

        searchLocations(searchStorage.current_query, 10).catch(() => {});
    }, [searchStorage.current_query, clearSearch, searchLocations])

    useEffect(() => {
        if (!isLoading) return;

        const timeout = window.setTimeout(
            () => setTimedOutSearchRequestId(searchRequestId),
            SLOW_LOCATION_SEARCH_MS,
        );
        return () => window.clearTimeout(timeout);
    }, [isLoading, searchRequestId])

    return (
        <ColSection
            arrangementSubsections="between"
            className="h-full min-h-0 gap-7 p-2"
            title="Busqueda"
        >
            <SegmentedTabs format='row'>
                <TabItem
                    tabTitle="Todo"
                    isActive={tab === 'all'}
                    onClick={() => setTab('all')}
                />
                <TabItem
                    tabTitle="Incidentes"
                    isActive={tab === 'incidents'}
                    onClick={() => setTab('incidents')}
                
                />
                <TabItem
                    tabTitle="Lugares"
                    isActive={tab === 'locations'}
                    onClick={() => setTab('locations')}
                />
            </SegmentedTabs>

            <div className="-mr-3 flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto p-0.5 pr-3.5 font-ui sm:-mr-4 sm:w-[max(25rem,calc(25vw-2rem))] sm:pr-4.5">
                {!isLoading && suggestions.length !== 0 && ["all", "locations"].includes(tab) &&  
                    <OptionList
                        format='col'
                        title="LUGARES"
                    >
                        {(tab === 'locations' ? suggestions : suggestions.slice(0, 3)).map((s, index) => {
                            const valueBadge = index >= 3
                                ? undefined
                                : currentIncidentLookup === null
                                    ? "…"
                                    : currentIncidentLookup.failedBySuggestion[index]
                                    ? "—"
                                    : currentIncidentLookup.reportsBySuggestion[index]?.length ?? 0;

                            const placeName = typeof s.properties.name === "string" ? s.properties.name : "";

                            return (
                                <ListTile
                                    key={`${s.geometry.coordinates.join(',')}-${index}`}
                                    tileName={placeName || "Lugar sin nombre"}
                                    tileDescription={
                                        [
                                            traducirTipoPhoton(s.properties.type), 
                                            s.properties.county
                                        ]
                                            .filter(
                                                (part): 
                                                part is string => typeof part === "string" && part !== ""
                                            ).join(" · ")
                                    }
                                    valueBadge={valueBadge !== undefined ? `${valueBadge} activos` : undefined}
                                    onClick={() => handleSelectLocation(
                                        s.properties.name as string,
                                        s.geometry.coordinates[1],
                                        s.geometry.coordinates[0],
                                    )}
                                />
                            );
                        })}
                    </OptionList>
                }

                {isLoading && !slowSearchElapsed && ["all", "locations"].includes(tab) &&
                    <SubSection className="flex-col items-start justify-start gap-2" format="col">
                        <SubSection as='span' className={sectionTitleStyle}>LUGARES</SubSection>
                        <SubSection className="items-center gap-2 py-3" format="row">
                            <LoadingIcon label="Buscando lugares" />
                            <span className="text-caption text-ink-muted">Buscando lugares…</span>
                        </SubSection>
                    </SubSection>
                }

                {suggestions.length === 0 &&
                    ["all", "locations"].includes(tab) &&
                    ((hasLocationQuery && (!isLoading || slowSearchElapsed)) ||
                        (tab === "locations" && !hasLocationQuery && !isLoading)) &&
                    <SubSection className="flex-col items-start justify-start gap-2" format="col">
                        <SubSection as='span' className={sectionTitleStyle}>LUGARES</SubSection>
                        <span className="py-3 text-caption text-ink-muted">
                            {error
                                ? "No se pudieron buscar lugares. Intenta de nuevo."
                                : hasLocationQuery
                                    ? "No se encontraron coincidencias"
                                    : "Escribe una búsqueda para encontrar lugares."}
                        </span>
                    </SubSection>
                }

                {closeIncidents.length !== 0 && ['all', 'incidents'].includes(tab) && 
                    <SubSection className="flex-col items-start justify-start gap-2" format="col">
                        <SubSection as='span' className={sectionTitleStyle}>INCIDENTES Y REPORTES</SubSection>
                        {closeIncidents.map((i) => 
                            <IncidentRow
                                key={i.id}
                                reporte={i}
                                incidente={categories.get(i.incidente_id)}
                                onClick={() => openPanel("Detalle Incidente", { reporteId: i.id })}
                            />
                        )}
                    </SubSection>
                }

                {closeIncidents.length === 0 &&
                    ["all", "incidents"].includes(tab) &&
                    !isLoading &&
                    !isLoadingIncidents &&
                    (tab === "incidents" || hasLocationQuery) &&
                    <SubSection className="flex-col items-start justify-start gap-2" format="col">
                        <SubSection as='span' className={sectionTitleStyle}>INCIDENTES Y REPORTES</SubSection>
                        <span className="py-3 text-caption text-ink-muted">
                            {currentIncidentLookup?.error
                                ? "No se pudieron cargar los incidentes cercanos. Intenta de nuevo."
                                : hasLocationQuery
                                    ? "No se encontraron incidentes cercanos."
                                    : "Busca un lugar para ver incidentes cercanos."}
                        </span>
                    </SubSection>
                }

                {tab === 'all' &&
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
                }
            </div>

        </ColSection>
    );
}