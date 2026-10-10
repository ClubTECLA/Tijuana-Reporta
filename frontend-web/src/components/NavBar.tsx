import { Fragment, type ReactNode } from "react"
import { useRouter } from "../hooks/useRouter"
import { Link } from "react-router-dom"

//import icons
import { LuMap, LuSun, LuTent, LuTrendingUp, LuTriangleAlert, LuUsers } from "react-icons/lu"
import type { NavItemsType } from "../types/utils-types"
import { useCommonPanel } from "../hooks/contexts/CommonPanelContext"


const navItemStyle = (isActive: boolean) => `
    flex h-11 shrink-0 flex-row items-center gap-2
    rounded-full px-4 text-sm
    transition-colors duration-200
    ${isActive ? 'bg-[#0b1220] font-bold text-white' : 'font-semibold text-slate-700 hover:bg-slate-100'}
`

function NavItemContent({ icon, title, cantNoti }: { icon: ReactNode, title: string, cantNoti?: number }) {
    return (
        <>
            <span className="text-lg">{icon}</span>
            <span>{title}</span>
            {!!cantNoti &&
                <span className="rounded-full bg-[#c30508] px-1.75 py-px text-[11px] font-bold text-white">{cantNoti}</span>
            }
        </>
    )
}
export default function NavBar() {
    const { setPanelView } = useCommonPanel();

    const router = useRouter();
    const currentPath = router.pathname;
    
    const navItems: NavItemsType = [
            {
                icon: <LuMap/>,
                title: "Resumen",
                cantNoti: 12,
                destinationPath: "/reports"    
            },
            {
                icon: <LuTriangleAlert />,
                title: "Incidentes",
                destinationPath: "/incidents"
            },
            {
                icon: <LuTent />,
                title: "Refugios",
                destinationPath: "/shelters"
            },
            {
                icon: <LuTrendingUp />,
                title: "Riesgo",
                destinationPath: "/risk"
            },
            {
                icon: <LuUsers />,
                title: "Usuarios",
                destinationPath: "/users"
            },
            {
                icon: <LuSun/>,
                title: "Ajustes",
                onClick: () => setPanelView('Ajustes')
            }
        ]

    return(
        <section 
            className="
                mx-auto flex h-14 w-fit flex-row items-center gap-0.5 p-1
                rounded-full border border-white/70 bg-white
                font-['Plus_Jakarta_Sans',sans-serif]
                shadow-[0_2px_8px_rgba(11,18,32,0.06),0_8px_24px_-6px_rgba(11,18,32,0.05)]
            "
        >
    {navItems.map((item, idx) =>
                <Fragment key={idx}>
                    {item.destinationPath && !item.onClick &&
                        <Link
                            className={navItemStyle(currentPath === item.destinationPath)}
                            to={item.destinationPath}
                        >
                            <NavItemContent {...item} />
                        </Link>
                    }
                    {!item.destinationPath && item.onClick &&
                        <button
                            type="button"
                            className={navItemStyle(currentPath === item.destinationPath)}
                            onClick={item.onClick}
                        >
                            <NavItemContent {...item} />
                        </button>
                    }
                </Fragment>
            )}
        </section>
    )
}