import { useAuth } from "@/features/sesion/useAuth";
import { FiUser } from "react-icons/fi";
import { IoIosClose } from "react-icons/io";
import { useCommonPanel } from "@/panels/useCommonPanel";
import useModals from "@/panels/useModals";
import { MdLogout } from "react-icons/md";
import ColSection from "@/components/layout/ColSection";
import RowSection from "@/components/layout/RowSection";
import Button from "@/components/ui/Button";
import { ListTile, OptionList } from "@/components/ui/OptionsList";
import UserCart from "@/features/perfil/components/UserCart";

export default function UserMenu() {
    const { user, logout } = useAuth();
    const { openPanel, closePanel } = useCommonPanel();
    const { closeModal } = useModals();

    return (
        <ColSection
            className="px-4 pb-2"
        >
            <RowSection arrangementSubsections="toLeft">
                <UserCart
                    format="row"
                    username={user?.username || "Usuario"}
                    email={user?.email || "email@email.com"}
                    rolName={user?.rol_name || "Rol"}
                />
                <Button
                    icon={<IoIosClose />}
                    ariaLabel="Cerrar menú"
                    variant="subtle"
                    onClick={closeModal}
                />
            </RowSection>

            <OptionList format="col">
                <ListTile
                    tileName="Mi perfil y contraseña"
                    onClick={() => {
                        openPanel("Mi perfil");
                        closeModal();
                    }}
                    icon={<FiUser />}
                />
                <ListTile
                    tileName="Cerrar Sesion"
                    onClick={() => {
                        logout();
                        closeModal();
                        closePanel();
                    }}
                    icon={<MdLogout />}
                    color='red'
                />
            </OptionList>
        </ColSection>
    );
}