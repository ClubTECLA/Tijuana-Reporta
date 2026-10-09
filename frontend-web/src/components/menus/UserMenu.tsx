import { FaUser } from "react-icons/fa6";
import { useAuth } from "../../hooks/contexts/AuthContext";
import type { ReactNode } from "react";
import { FiUser } from "react-icons/fi";
import { IoIosArrowForward, IoIosClose } from "react-icons/io";
import { useCommonPanel } from "../../hooks/contexts/CommonPanelContext";
import useModals from "../../hooks/useModals";
import { MdLogout } from "react-icons/md";

type OptionsColor = "red" | "blue" | "green";

type MenuOptions = {
    icon: ReactNode;
    title: string;
    onClick?: () => void;
    color?: OptionsColor;
};

export default function UserMenu() {
    const { user, logout } = useAuth();
    const { setPanelView, closePanel } = useCommonPanel();
    const { closeModal } = useModals();

    const options: MenuOptions[] = [
        {
            icon: <FiUser />,
            title: "Mi perfil y contraseña",
            color: "blue",
            onClick: () => {setPanelView("Mi perfil"); closeModal()},
        },{
            icon: <MdLogout/>,
            title: 'Cerrar Sesion',
            color: 'red',
            onClick: () => {logout(); closeModal(); closePanel()}
        }
    ];

    return (
        <section 
            className="
                rounded-3xl bg-white w-fit h-fit 
                p-4 shadow-lg shadow-gray-600 
                pointer-events-auto
                fixed top-16 right-5
            "
        >
            <div className="flex flex-row gap-3 items-center">
                {!user?.username ? (
                    <div
                        className="
                            rounded-full bg-blue-600 text-white font-bold
                            w-12 h-12 flex items-center justify-center
                        "
                    >
                        {user?.username?.slice(0, 2).toUpperCase() || "BC"}
                    </div>
                ) : (
                    <div className="bg-blue-600 rounded-full p-5 text-white text-lg">
                        <FaUser />
                    </div>
                )}
                <div className="flex flex-col w-50">
                    <span className="text-md font-bold text-gray-800">{user?.username || "Usuario"}</span>
                    <span className="text-sm text-gray-500">{user?.email || "email@email.com"}</span>
                    <span className="text-sm text-blue-600 font-bold">{user?.rol_name || "Rol"}</span>
                </div>
                <button 
                    type='button'
                    aria-label="Cerrar"
                    className="
                        flex items-center justify-center 
                        w-10 h-10 rounded-full 
                        bg-gray-200 text-4xl font-bold text-gray-800 
                        hover:bg-gray-100 hover:scale-120 transition-all duration-300 
                    "
                    onClick={closeModal}
                >
                    <IoIosClose/>
                </button>
            </div>
            <div className="rounded-xl border-2 border-gray-300 mt-4 p-1">
                {options.map((option, idx) => {
                    const color: OptionsColor = option.color || "blue";
                    const wrapped = `bg-${color}-100 text-${color}-500`;

                    return (
                        <button
                            className={`flex flex-row px-4 py-2 text-xl gap-3
                                hover:bg-gray-300 group
                                transition-all duration-300 rounded-2xl w-full
                            `}
                            onClick={option.onClick}
                            key={idx}
                        >
                            <div className={`${wrapped} p-3 rounded-xl`}>
                                {option.icon}
                            </div>
                            <span
                                className="
                                    flex items-center justify-start
                                    font-bold text-sm
                                    text-gray-700
                                    w-full
                                "
                            >
                                {option.title}
                            </span>
                            {option.onClick ? (
                                <div className="
                                        flex items-center 
                                        justify-center 
                                        text-gray-500 
                                        text-2xl transition-all 
                                        duration-300
                                    "
                                >
                                    <IoIosArrowForward />
                                </div>
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </section>
    );
}