import { useRouter } from '@/lib/useRouter';
import BellButton from '@/features/notificaciones/components/BellButton';
import NavBar from "./NavBar";
import SearchBar from './SearchBar';
import UserProfileWidget from "@/features/perfil/components/UserProfileWidget";
import useModals from '@/panels/useModals';
import { useCommonPanel } from '@/panels/useCommonPanel';
import { useLocationPicker } from '@/features/mapa/useLocationPicker';
import { useSysMessage } from "@/components/ui/SysMessageContext";
import { useLocalStorage } from '@/lib/useLocalStorage';
import { useEffect, useRef, useState } from "react";
import { addRecentSearch } from '@/lib/utils';

const SEARCH_DEBOUNCE_MS = 400;

export default function NavigationWrapper() {
    const [ generalPreferences ] = useLocalStorage('Preferencias generales');
    const [ searchStorage, setSearchStorage ] = useLocalStorage('Almacenamiento de Busqueda');
    const { openModal, closeModal, currentModal} = useModals()
    const { currentPanelView, openPanel } = useCommonPanel();
    const { pathname } = useRouter();
    const { search, editAddress, cancelSearch, address, locationFlightVersion } = useLocationPicker();
    const { showMessage } = useSysMessage();
    // La preferencia muestra la dirección fuera de la búsqueda; al abrir Busqueda se muestra siempre.
    const shouldShowLocation =
        currentPanelView !== "Nuevo Incidente" &&
        (generalPreferences.show_location_in_searchBar || currentPanelView === "Busqueda");
    // Consulta escrita o elegida mientras se edita, y texto alternativo cuando no se muestra la dirección.
    const [ searchQuery, setSearchQuery ] = useState("");
    const [ hasFocusedSearchBar, setHasFocusedSearchBar ] = useState(false);
    const [ focusedAtLocationFlightVersion, setFocusedAtLocationFlightVersion ] = useState(locationFlightVersion);
    const [ previousPanelView, setPreviousPanelView ] = useState(currentPanelView);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isEditingSearchQuery =
        currentPanelView === "Busqueda" &&
        hasFocusedSearchBar &&
        focusedAtLocationFlightVersion === locationFlightVersion;
    const shouldShowMapAddress =
        shouldShowLocation ||
        (currentPanelView !== "Nuevo Incidente" && locationFlightVersion > 0);

    if (previousPanelView !== currentPanelView) {
        setPreviousPanelView(currentPanelView);
        if (previousPanelView === "Busqueda" && currentPanelView !== "Busqueda") {
            setHasFocusedSearchBar(false);
        }
    }

    useEffect(() => () => {
        if (searchDebounceRef.current !== null) clearTimeout(searchDebounceRef.current);
    }, []);

    const handleSearchAddress = async (query: string) => {
        if (searchDebounceRef.current !== null) {
            clearTimeout(searchDebounceRef.current);
            searchDebounceRef.current = null;
        }
        setSearchStorage((prev) => ({ ...prev, current_query: query }));
        addRecentSearch(query, setSearchStorage);

        try {
            const result = await search(query);

            if (result === "not-found") {
                showMessage("No encontramos esa dirección en Tijuana.", { color: "yellow", type: "float", title: "Ubicación" });
            }
            
        } catch {
            showMessage("No se pudo buscar la dirección. Intenta de nuevo.", { color: "red", type: "float", title: "Ubicación" });        
        }
    };

    const handleChangeQuery = (query: string) => {
        setSearchQuery(query);
        if (searchDebounceRef.current !== null) {
            clearTimeout(searchDebounceRef.current);
            searchDebounceRef.current = null;
        }
        if (searchStorage.current_query) {
            setSearchStorage((prev) => ({ ...prev, current_query: "" }));
        }
        if (query.trim()) {
            searchDebounceRef.current = setTimeout(() => {
                searchDebounceRef.current = null;
                setSearchStorage((prev) => ({ ...prev, current_query: query }));
            }, SEARCH_DEBOUNCE_MS);
        }
        cancelSearch();
    }

    const selectedRecentSearch = searchStorage.selected_recent_search;

    useEffect(() => {
        if (!selectedRecentSearch) return;

        setSearchQuery(selectedRecentSearch);
        editAddress(selectedRecentSearch);
        setSearchStorage((prev) => ({
            ...prev,
            'selected_recent_search': "",
            'current_query': selectedRecentSearch,
        }));

        handleSearchAddress(selectedRecentSearch);
    }, [selectedRecentSearch, editAddress, setSearchStorage])

    useEffect(() => {
        if (currentPanelView) return;

        setSearchQuery("");
        if (searchDebounceRef.current !== null) {
            clearTimeout(searchDebounceRef.current);
            searchDebounceRef.current = null;
        }
        cancelSearch();

        setSearchStorage((prev) => ({
            ...prev,
            'selected_recent_search': "",
            'current_query': "",
        }));        
    }, [currentPanelView, cancelSearch, setSearchStorage])

    const handleOnFocusSearchBar = () => {
        if (!isEditingSearchQuery) {
            setSearchQuery("");
            if (searchDebounceRef.current !== null) {
                clearTimeout(searchDebounceRef.current);
                searchDebounceRef.current = null;
            }
            cancelSearch();
            setSearchStorage((prev) => ({ ...prev, current_query: "" }));
        }
        setHasFocusedSearchBar(true);
        setFocusedAtLocationFlightVersion(locationFlightVersion);
        openPanel('Busqueda');
    }

    if(pathname === '/auth'){
        return null
    }

    return (
        <section className="pointer-events-none fixed inset-0 z-50">
            <div className="pointer-events-auto fixed inset-x-2 top-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:inset-x-4 sm:flex sm:justify-end">
                <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 sm:flex-5/6">
                    <div className="min-w-0 flex-1 sm:flex-1/3">
                        <SearchBar
                            onSubmit={handleSearchAddress}
                            onChangeQuery={handleChangeQuery}
                            value={shouldShowMapAddress && !isEditingSearchQuery ? address : searchQuery}
                            onFocus={handleOnFocusSearchBar}
                            shadow
                        />
                    </div> 
                    <div className="hidden min-w-0 sm:flex sm:flex-2/3">
                        <NavBar />
                    </div>
                </div>
                <div className="col-start-2 row-start-1 flex items-center justify-end gap-1 sm:flex-1/6 sm:gap-2">
                    <BellButton 
                        onClick={() => currentModal === 'Menu de Notificaciones'
                            ? closeModal()
                            : openModal('Menu de Notificaciones')}
                    />
                    <UserProfileWidget 
                        className="" 
                        onClick={() => openModal('Menu de Usuario')}
                    />    
                </div>
                <div className="col-span-2 row-start-2 w-full sm:hidden">
                    <NavBar />
                </div>
            </div>
        </section>
    )
}