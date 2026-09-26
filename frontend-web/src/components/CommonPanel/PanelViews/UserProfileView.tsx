import { FiSmartphone } from "react-icons/fi";
import ColSection from "../PanelComponents/primitive-components/ColSection";
import Input from "../view-components/Input";
import { ListTile, OptionList } from "../view-components/OptionsList";
import UserCart from "../view-components/UserCart";
import { GoShieldCheck } from "react-icons/go";
import { LuLock } from "react-icons/lu";



export default function UserProfileView() {
    return(
        <ColSection 
            arrangementSubsections='toDown'
            title="Mi perfil" 
            subtitle="Cuenta institucional - Proteccion Civil"   
        >
            <UserCart format={'col'} username="" email="jdanielgr2005@gmail.com" rolName="Administrador"/>
            <Input format={'col'} label="Nombre visible" debug={false}/>
            <Input format={'col'} label="Celular para codigos" debug={false}/>
            <OptionList format="col" debug={false} title="Seguridad">
                <ListTile 
                    tileName="Cambiar contraseña"
                    tileDescription="Actualizada hace 3 meses"
                    onClick={() => {}}
                    icon={<LuLock/>}
                />
                <ListTile 
                    tileName="Verificacion en dos pasos"
                    tileDescription="Codigo por SMS al iniciar sesion"
                    type='checkbox'
                    onChange={() => {}}
                    icon={<GoShieldCheck/>}
                />
                <ListTile 
                    tileName="Sesiones activas"
                    tileDescription="Chrome . Windows (esta) . iPad"
                    onClick={() => {}}
                    icon={<FiSmartphone/>}
                />
            </OptionList>
            <OptionList format='row' debug={false} title="Preferencias">
                <ListTile 
                    tileName="Tema oscuro"
                    tileDescription="Usa la version oscura de consola"
                    onChange={() => {}}
                    type='checkbox'
                    icon={<LuLock/>}
                />
                <ListTile 
                    tileName="Notificaciones"
                    tileDescription="Que te avisamos y por donde"
                    onClick={() => {}}
                    icon={<LuLock/>}
                />
            </OptionList>
        </ColSection>
    )
}