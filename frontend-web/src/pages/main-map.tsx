import BellButton from "../components/BellButton";
import MapContainer from "../components/MapContainer";

export default function MainMapPage(){
    return(
        <section className="relative">
            <MapContainer/>
            <BellButton className="absolute top-5 right-30 border-2 border-black"/>
        </section>
    )
}