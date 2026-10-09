import { FiHelpCircle, FiMoon, FiSmartphone } from "react-icons/fi";
import ColSection from "../PanelAndModalComponents/primitive-components/ColSection";
import Input from "../PanelAndModalComponents/view-components/Input";
import { ListTile, OptionList } from "../PanelAndModalComponents/view-components/OptionsList";
import UserCart from "../PanelAndModalComponents/view-components/UserCart";
import { GoShieldCheck } from "react-icons/go";
import { LuLock, LuSun } from "react-icons/lu";
import { IoMdNotificationsOutline } from "react-icons/io";
import { useAuth } from "../../../hooks/contexts/AuthContext";
import { FaUserLock } from "react-icons/fa6";
import { useEffect, useState, type ChangeEvent } from "react";
import Button from "../PanelAndModalComponents/view-components/Button";
import RowSection from "../PanelAndModalComponents/primitive-components/RowSection";
import { useCommonPanel } from "../../../hooks/contexts/CommonPanelContext";

type FormState = {
    username: string;
    email: string;
};

export default function UserProfileView() {
    const { setPanelView } = useCommonPanel();
    const { user, isAuthenticated } = useAuth();
    const [form, setForm] = useState<FormState>({
        username: "",
        email: "",
    });

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        setForm({
            username: user.username,
            email: user.email ?? "",
        });
    }, [isAuthenticated, user]);

    const handleChangeForm = (e: ChangeEvent<HTMLInputElement>) => {
        const field = e.target.name as keyof FormState;

        setForm((prev) => ({
            ...prev,
            [field]: e.target.value,
        }));
    };

    if (!isAuthenticated || !user) {
        return (
            <div className="flex flex-row items-center justify-center gap-3 text-red-800">
                <FaUserLock className="text-3xl" />
                <span className="text-xl">Acceso Denegado</span>
            </div>
        );
    }

    return (
        <ColSection
            arrangementSubsections="toDown"
            title="Mi perfil"
            subtitle="Cuenta institucional - Proteccion Civil"
            className="pb-10 overflow-y-auto px-2"
        >
            <UserCart
                format={"col"}
                username={user.username}
                email={user.email}
                rolName={user.rol_name}
            />
            <Input
                format={"col"}
                label="Nombre visible"
                debug={false}
                value={form.username}
                onChange={handleChangeForm}
                name="username"
            />
            <Input
                format={"col"}
                label="Celular para codigos"
                debug={false}
                value={form.email}
                onChange={handleChangeForm}
                name="email"
            />
            <OptionList format="col" debug={false} title="Seguridad">
                <ListTile
                    tileName="Cambiar contraseña"
                    tileDescription="Actualizada hace 3 meses"
                    onClick={() => {}}
                    icon={<LuLock />}
                />
                <ListTile
                    tileName="Verificacion en dos pasos"
                    tileDescription="Codigo por SMS al iniciar sesion"
                    type="checkbox"
                    onChange={() => {}}
                    icon={<GoShieldCheck />}
                />
                <ListTile
                    tileName="Sesiones activas"
                    tileDescription="Chrome . Windows (esta) . iPad"
                    valueBagde={2}
                    onClick={() => {}}
                    icon={<FiSmartphone />}
                />
            </OptionList>
            <OptionList format="col" debug={false} title="Preferencias">
                <ListTile
                    tileName="Tema oscuro"
                    tileDescription="Usa la version oscura de consola"
                    onChange={() => {}}
                    type="checkbox"
                    icon={<FiMoon />}
                />
                <ListTile
                    tileName="Notificaciones"
                    tileDescription="Que te avisamos y por donde"
                    onClick={() => setPanelView('Notificaciones')}
                    icon={<IoMdNotificationsOutline />}
                />
                <ListTile
                    tileName="Ayudas y guias"
                    tileDescription="Respuestas rapidas para el equipo"
                    onClick={() => setPanelView('Ayudas y guias')}
                    icon={<FiHelpCircle />}
                />
            </OptionList>
            <RowSection debug={false} arrangementSubsections='toLeft' className="gap-3 mt-5">
                <Button
                    title="Descartar"
                    format='row'
                    color='gray'
                />
                <Button
                    title="Guardar Cambios"
                    format='row'
                    icon={<LuSun />}
                    color='blue'
                />
            </RowSection>
        </ColSection>
    );
}