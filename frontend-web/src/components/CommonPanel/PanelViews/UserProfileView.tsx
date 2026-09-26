import ColSection from "../PanelComponents/primitive-components/ColSection";
import UserCart from "../view-components/UserCart";



export default function UserProfileView() {
    return(
        <ColSection 
            arrangementSubsections='toDown'
            title="Mi perfil" 
            subtitle="Cuenta institucional - Proteccion Civil"   
        >
            <UserCart username="" email="jdanielgr2005@gmail.com" rolName="Administrador"/>
        </ColSection>
    )
}