import { useRouter } from '../hooks/useRouter';
import BellButton from './BellButton';
import NavBar from "./NavBar";
import SearchBar from './SearchBar';
import UserProfileWidget from "./UserProfileWidget";
import { modals } from '../types/global-modals';
import useModals from '../hooks/useModals';

export default function NavigationWrapper() {
    const { setModal, currentModal} = useModals()
    const { pathname } = useRouter();

    if(pathname === '/auth'){
        return null
    }
    return (
        <section className="pointer-events-none fixed inset-0 z-50">
            <div className="pointer-events-auto fixed inset-x-2 top-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:inset-x-4 sm:flex sm:justify-end">
                <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 sm:flex-5/6">
                    <div className="min-w-0 flex-1 sm:flex-1/3">
                        <SearchBar/>
                    </div> 
                    <div className="hidden min-w-0 sm:flex sm:flex-2/3">
                        <NavBar />
                    </div>
                </div>
                <div className="col-start-2 row-start-1 flex items-center justify-end gap-1 sm:flex-1/6 sm:gap-2">
                    <BellButton 
                        onClick={() => setModal(
                            currentModal === 'Menu de Notificaciones'
                                ? null
                                : 'Menu de Notificaciones'
                        )}
                    />
                    <UserProfileWidget 
                        className="" 
                        onClick={() => setModal('Menu de Usuario')}
                    />    
                </div>
                <div className="col-span-2 row-start-2 w-full sm:hidden">
                    <NavBar />
                </div>
            </div>

            {currentModal && modals[currentModal]}
        </section>
    )
}