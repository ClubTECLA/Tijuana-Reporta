import { useRouter } from "../hooks/useRouter"
import { Link } from "react-router-dom"

//import icons
import { GrDocumentText } from "react-icons/gr"
import { GoAlert, GoPaperAirplane } from "react-icons/go"
import type { NavItemsType } from "../types/utils-types"
import { IoSettingsOutline } from "react-icons/io5"
import { useCommonPanel } from "../hooks/contexts/CommonPanelContext"



export default function NavBar() {
    const { setPanelView } = useCommonPanel();

    const router = useRouter();
    const currentPath = router.pathname;
    
    const navItems: NavItemsType = [
            {
                icon: <GrDocumentText/>,
                title: "Resumen",
                cantNoti: 12,
                destinationPath: "/reports"    
            },
            {
                icon: <GoAlert />,
                title: "Incidentes",
                destinationPath: "/incidents"
            },
            {
                icon: <GoPaperAirplane />,
                title: "Avisos",
                destinationPath: "/warnings"
            },
            {
                icon: <IoSettingsOutline/>,
                title: "Ajustes",
                onClick: () => setPanelView('Ajustes')
            }
        ]

    return(
        <section 
            className="
                flex flex-row gap-2 bg-white 
                px-4 py-1 rounded-full shadow-lg 
                shadow-gray-600 w-full
                items-center
            "
        >
            {navItems.map((item, idx) => 
                <div
                    key={idx}
                    className="flex min-w-0 flex-1"
                >
                    {item.destinationPath && !item.onClick &&
                        <Link
                            className={`
                                flex flex-row items-center 
                                justify-center gap-2  
                                rounded-full px-3 py-1
                                font-bold  w-full
                                hover:bg-gray-800 hover:text-white transition-all duration-300
                                ${currentPath === item.destinationPath ? 'text-white bg-gray-800' : 'text-gray-600'}
                            `}
                            aria-label={item.title}
                            title={item.title}
                            to={item.destinationPath}
                        >
                            {item.icon}
                            <span className="hidden md:inline">{item.title}</span>
                        </Link>
                    }
                    {!item.destinationPath && item.onClick &&
                        <button
                            className={`
                                flex flex-row items-center 
                                justify-center gap-2  
                                rounded-full px-3 py-1
                                font-bold w-full
                                hover:bg-gray-800 hover:text-white transition-all duration-300
                                ${currentPath === item.destinationPath ? 'text-white bg-gray-800' : 'text-gray-600'}
                            `}
                            aria-label={item.title}
                            title={item.title}
                            onClick={item.onClick}
                        >
                            {item.icon}
                            <span className="hidden md:inline">{item.title}</span>
                        </button>
                    }
                </div>
            )}
        </section>
    )
}