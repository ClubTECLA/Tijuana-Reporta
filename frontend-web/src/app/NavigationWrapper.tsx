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

export default function NavigationWrapper() {
    const [ generalPreferences ] = useLocalStorage('Preferencias generales');
    const { openModal, closeModal, currentModal} = useModals()
    const { currentPanelView } = useCommonPanel();
    const { pathname } = useRouter();
    const { search, editAddress, address } = useLocationPicker();
    const { showMessage } = useSysMessage();

    const handleSearchAddress = async (query: string) => {
        try {
            if (await search(query) === "not-found") {
                showMessage("No encontramos esa dirección en Tijuana.", { color: "yellow", type: "float", title: "Ubicación" });
            }
        } catch {
            showMessage("No se pudo buscar la dirección. Intenta de nuevo.", { color: "red", type: "float", title: "Ubicación" });
        }
    };

    if(pathname === '/auth'){
        return null
    }
    return (
        <section className="pointer-events-none fixed inset-0 z-50">
            {/* Por debajo de 1024 px, dos filas: el buscador (con la campana y el perfil) y debajo las secciones a todo el
                ancho. En teléfono, como en el Figma móvil y Google Maps, el buscador ocupa toda su fila con el perfil
                dentro, y la campana pasa a los botones flotantes del mapa (MapContainer). */}
            <div className="pointer-events-auto fixed inset-x-2 top-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:inset-x-4 lg:flex lg:justify-end">
                <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 max-sm:col-span-2 lg:flex-5/6">
                    <div className="min-w-0 flex-1 lg:flex-1/3">
                        <SearchBar
                            onSubmit={handleSearchAddress}
                            onChangeQuery={editAddress}
                            value={(currentPanelView !== "Nuevo Incidente" && generalPreferences.show_location_in_searchBar) ? address : "" }
                            className="max-lg:max-w-none max-sm:pr-14"
                        />
                    </div>
                    <div className="hidden min-w-0 lg:flex lg:flex-2/3">
                        <NavBar />
                    </div>
                </div>
                <div className="col-start-2 row-start-1 flex items-center justify-end gap-1 max-sm:absolute max-sm:right-1.5 max-sm:top-1.5 sm:gap-2 lg:flex-1/6">
                    <BellButton
                        className="max-sm:hidden"
                        onClick={() => currentModal === 'Menu de Notificaciones'
                            ? closeModal()
                            : openModal('Menu de Notificaciones')}
                    />
                    <UserProfileWidget
                        className="max-sm:h-11 max-sm:border-0 max-sm:p-0.5 max-sm:shadow-none"
                        onClick={() => openModal('Menu de Usuario')}
                    />
                </div>
                <div className="col-span-2 row-start-2 w-full lg:hidden">
                    <NavBar className="w-full *:flex-1 *:justify-center" />
                </div>
            </div>
        </section>
    )
}