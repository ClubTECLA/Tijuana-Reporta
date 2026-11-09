import { FiHelpCircle, FiMoon } from "react-icons/fi";
import ColSection from "@/components/layout/ColSection";
import Input from "@/components/ui/Input";
import { ListTile, OptionList } from "@/components/ui/OptionsList";
import UserCard from "@/features/perfil/components/UserCard";
import { GoShieldCheck } from "react-icons/go";
import { LuLock, LuSun } from "react-icons/lu";
import { IoMdNotificationsOutline } from "react-icons/io";
import { useAuth } from "@/features/sesion/useAuth";
import { FaUserLock } from "react-icons/fa6";
import { useEffect, useState, type ChangeEvent } from "react";
import Button from "@/components/ui/Button";
import RowSection from "@/components/layout/RowSection";
import { useCommonPanel } from "@/panels/useCommonPanel";
import { GrMapLocation } from "react-icons/gr";
import { useLocalStorage } from "@/lib/useLocalStorage";

type FormState = {
    username: string;
    email: string;
};

export default function UserProfileView() {
    const [ preferences, setPreferences ] = useLocalStorage('Preferencias generales');
    const [ userAuthPreferences, setUserAuthPreferences ] = useLocalStorage('Preferencias de seguridad');
    const { openPanel } = useCommonPanel();
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
            <div className="flex flex-row items-center justify-center gap-3 text-danger">
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
            <UserCard
                format={"col"}
                username={user.username}
                email={user.email}
                rolName={user.rol_name}
                bg_color='blue'
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
                label="Correo electronico"
                debug={false}
                value={form.email}
                onChange={handleChangeForm}
                name="email"
            />
            <OptionList format="col" title="Seguridad">
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
            </OptionList>
            <OptionList format="col" title="Preferencias">
                <ListTile
                    tileName="Tema oscuro"
                    tileDescription="Usa la version oscura de consola"
                    onChange={() => {}}
                    type="checkbox"
                    icon={<FiMoon />}
                />
                <ListTile
                    type='checkbox'
                    onChange={() => {}}
                    tileName="Mostrar ubicacion al navegar"
                    tileDescription="Mostrar la ubicacion en la barra de busqueda al moverde y dar click sobre el mapa."
                    icon={<GrMapLocation />}
                />
                <ListTile
                    tileName="Notificaciones"
                    tileDescription="Que te avisamos y por donde"
                    onClick={() => openPanel('Notificaciones')}
                    icon={<IoMdNotificationsOutline />}
                />
                <ListTile
                    tileName="Ayudas y guias"
                    tileDescription="Respuestas rapidas para el equipo"
                    onClick={() => openPanel('Ayudas y guias')}
                    icon={<FiHelpCircle />}
                />
            </OptionList>
            <RowSection debug={false} arrangementSubsections='toLeft' className="gap-3 mt-5">
                <Button
                    title="Descartar"
                    format='row'
                    variant="subtle"
                />
                <Button
                    title="Guardar Cambios"
                    format='row'
                    icon={<LuSun />}
                    variant="primary"
                />
            </RowSection>
        </ColSection>
    );
}