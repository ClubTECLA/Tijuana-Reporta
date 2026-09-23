import BellButton from './BellButton';
import NavBar from "./NavBar";
import UserProfileWidget from "./UserProfileWidget";

export default function NavigationWrapper() {
    return (
        <section className="pointer-events-none z-50 fixed top-0 left-0 w-screen h-screen"> 
            <div className="pointer-events-auto fixed top-2 w-full h-13 flex flex-row justify-end pr-10 border-3">
                <div className="flex flex-5/6 border-2 w-100">
                    <div className="flex flex-1/3 border-2 ">
                        
                    </div> 
                    <div className="flex flex-2/3 border-2">
                        <NavBar />
                    </div>
                </div>
                <div className="flex flex-row flex-1/6 items-end justify-end gap-2 border-2">
                    <BellButton className=""/>
                    <UserProfileWidget className=""/>    
                </div>
            </div>

        </section>
    )
}