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
import { useEffect, useState } from "react";
import { addRecentSearch } from '@/lib/utils';

export default function NavigationWrapper() {
    const [ generalPreferences ] = useLocalStorage('Preferencias generales');
    const [ searchStorage, setSearchStorage ] = useLocalStorage('Almacenamiento de Busqueda');
    const { openModal, closeModal, currentModal} = useModals()
    const { currentPanelView, openPanel } = useCommonPanel();
    const { pathname } = useRouter();
    const { search, editAddress, address } = useLocationPicker();
    const { showMessage } = useSysMessage();
    // Con la preferencia activa la barra muestra directamente la dirección del selector (clic en el mapa, arrastre o
    // búsqueda). Al escribir se actualiza esa misma dirección con editAddress, así que no hace falta copiarla.
    const shouldShowLocation =
        generalPreferences.show_location_in_searchBar && currentPanelView !== "Nuevo Incidente";
    // Texto elegido por el usuario (escrito o una búsqueda reciente) para cuando la preferencia no muestra la dirección.
    const [ searchQuery, setSearchQuery ] = useState("");

    const handleSearchAddress = async (query: string) => {
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

    const handleChangeQuery = (query: string) => {
        setSearchQuery(query);
        setSearchStorage((prev) => ({...prev, 'current_query': query}));
        editAddress(query);
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
    }, [selectedRecentSearch, editAddress, setSearchStorage])

    const handleOnFocusSearchBar = () => {
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
                            value={shouldShowLocation ? address : searchQuery}
                            onFocus={handleOnFocusSearchBar}
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