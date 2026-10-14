import { useAuth } from "../../hooks/contexts/AuthContext";
import { FiUser } from "react-icons/fi";
import { IoIosClose } from "react-icons/io";
import { useCommonPanel } from "../../hooks/useCommonPanel";
import useModals from "../../hooks/useModals";
import { MdLogout } from "react-icons/md";
import ColSection from "../CommonPanelAndModal/PanelAndModalComponents/primitive-components/ColSection";
import RowSection from "../CommonPanelAndModal/PanelAndModalComponents/primitive-components/RowSection";
import Button from "../CommonPanelAndModal/PanelAndModalComponents/view-components/Button";
import { ListTile, OptionList } from "../CommonPanelAndModal/PanelAndModalComponents/view-components/OptionsList";
import UserCart from "../CommonPanelAndModal/PanelAndModalComponents/view-components/UserCart";

export default function UserMenu() {
    const { user, logout } = useAuth();
    const { setPanelView, closePanel } = useCommonPanel();
    const { closeModal } = useModals();

    return (
        <ColSection
            arrangementSubsections="toDown"
            className="h-fit w-fit gap-3 rounded-3xl bg-white p-4 shadow-lg shadow-gray-600"
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
                    color="gray"
                    onClick={closeModal}
                />
            </RowSection>

            <OptionList format="col">
                <ListTile
                    tileName="Mi perfil y contraseña"
                    onClick={() => {
                        setPanelView("Mi perfil");
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