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
        <section className="pointer-events-none z-50 fixed top-0 left-0 w-screen h-screen"> 
            <div className="pointer-events-auto fixed top-2 w-full h-13 flex flex-row justify-end pr-10">
                <div className="flex flex-5/6 w-100 gap-2">
                    <div className="flex flex-1/3">
                        <SearchBar/>
                    </div> 
                    <div className="flex flex-2/3">
                        <NavBar />
                    </div>
                </div>
                <div className="flex flex-row flex-1/6 items-end justify-end gap-2">
                    <BellButton className=""/>
                    <UserProfileWidget 
                        className="" 
                        onClick={() => setModal('Menu de Usuario')}
                    />    
                </div>
            </div>

            {currentModal && modals[currentModal]}
        </section>
    )
}