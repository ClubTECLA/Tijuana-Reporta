import { useEffect, useState} from "react"
import type { NavItem } from "../types/db-types"
import { useRouter } from "../hooks/useRouter"
import { Link } from "react-router-dom"

//import icons
import { FaRegMap } from "react-icons/fa"
import { GrDocumentText } from "react-icons/gr"
import { GoAlert, GoPaperAirplane } from "react-icons/go"

const navItems = [
            {
                icon: <FaRegMap />,
                title: "Mapa",
                destinationPath: "/"
            },
            {
                icon: <GrDocumentText/>,
                title: "Reportes",
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
            }
        ]

export default function NavBar() {
    const router = useRouter();
    const [ NavItems, setNavItems ] = useState<NavItem[]>(navItems)
    const currentPath = router.pathname;
    
    return(
        <section className="flex flex-row gap-2 bg-white px-4 py-1 rounded-full shadow-lg shadow-gray-600 w-full">
            {NavItems.map((item, idx) => 
                <Link
                    key={idx}
                    className={`
                        flex flex-row flex-1 items-center 
                        justify-center gap-2  
                        rounded-full px-3 py-1
                        font-bold
                        hover:bg-gray-800 hover:text-white transition-all duration-300
                        ${currentPath === item.destinationPath ? 'text-white bg-gray-800' : 'text-gray-600'}
                    `}
                    to={item.destinationPath}
                >
                    {item.icon}
                    <span>{item.title}</span>
                </Link>
            )}
        </section>
    )
}