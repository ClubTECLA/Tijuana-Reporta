import { FaUser } from "react-icons/fa6";
import { useAuth } from "../../hooks/contexts/AuthContext"
import type { ReactNode } from "react";
import { FiUser } from "react-icons/fi";
import { IoIosArrowForward } from "react-icons/io";

type optionsColor = "red" | 'blue' | 'green';

type menuOptions = {
    icon: ReactNode,
    title: string,
    onClick?: () => void,
    view?: ReactNode
    color?: optionsColor
}

export default function UserMenu() {
    const { user, isAuthenticated } = useAuth();

    const options: menuOptions[] = [
        {
            icon: <FiUser/>,
            title: "Mi perfil y contraseña",
            color: 'blue',
        },
    ]


    return (
        <section className="rounded-3xl bg-white w-fit h-fit p-4 shadow-lg shadow-gray-600">
            <div className="flex flex-row gap-3 items-center">
                {!user?.username ? 
                    <div
                        className="
                            rounded-full bg-blue-600 text-white font-bold
                            w-12 h-12 flex items-center justify-center
                        "
                    >{user?.username.slice(0,2).toUpperCase() || 'BC'}</div>
                :
                    <div className="bg-blue-600 rounded-full p-5 text-white text-lg"> <FaUser/> </div>
                }
                <div className="flex flex-col w-50">
                    <span className="text-md font-bold text-gray-800">{user?.username || "Usuario"}</span>
                    <span className="text-sm text-gray-500">{user?.email || "email@email.com"}</span>
                    <span className="text-sm text-blue-600 font-bold">{user?.rol_id || "Rol"}</span>
                </div>
            </div>
            <div className="rounded-xl border-2 border-gray-300 mt-4">
                {options.map((option) => {
                    
                    const color: optionsColor = option.color || 'blue';
                    const wrapped = `bg-${color}-100 text-${color}-500`;

                    return( 
                        <div className={`flex flex-row px-4 py-2 text-xl gap-3`}>
                            <div className={`${wrapped} p-3 rounded-xl`}>
                                {option.icon}
                            </div>
                            <span 
                                className="
                                    flex items-center justify-center 
                                    font-bold text-sm
                                    text-gray-700
                                "
                            >{option.title}</span>
                            {!option.view && 
                                <div className="flex items-center justify-center text-gray-500 text-2xl">
                                    <IoIosArrowForward/>
                                </div>
                            }
                        </div>
                    )
                })}
            </div>
            <div>

            </div>
        </section>
    )
}