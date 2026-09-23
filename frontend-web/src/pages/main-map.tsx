import BellButton from "../components/BellButton";
import MapContainer from "../components/MapContainer";
import UserProfileWidget from "../components/UserProfileWidget";

export default function MainMapPage(){
    
    return(
        <section className="">
            <MapContainer/>
            <div className="fixed top-2 w-full h-13 flex flex-row justify-end pr-10 border-3">
                <div className="flex flex-3/4 border-2 w-100">

                </div>
                <div className="flex flex-row flex-1/4 items-end justify-end gap-2 border-2">
                    <BellButton className=""/>
                    <UserProfileWidget className=""/>    
                </div>
            </div>
            
        </section>
    )
}