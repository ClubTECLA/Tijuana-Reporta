import { Fragment, type ReactNode } from "react"
import { useRouter } from "../hooks/useRouter"
import { Link } from "react-router-dom"

//import icons
import { LuMap, LuSun, LuTent, LuTrendingUp, LuTriangleAlert, LuUsers } from "react-icons/lu"
import type { NavItemsType } from "../types/utils-types"
import { useCommonPanel } from "../hooks/useCommonPanel"


const navItemStyle = (isActive: boolean) => `
    flex h-11 shrink-0 flex-row items-center gap-2
    rounded-full px-4 text-sm
    transition-colors duration-200
    ${isActive ? 
        'bg-[#0b1220] font-bold text-white' 
        : 
        'font-semibold text-slate-700 hover:bg-slate-100'
    }
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
    const { currentPanelView, setPanelView } = useCommonPanel();

    const router = useRouter();
    const currentPath = router.pathname;
    
    const navItems: NavItemsType = [
            {
                icon: <LuMap/>,
                title: "Resumen",
                cantNoti: 12,
                onClick: () => {}
            },
            {
                icon: <LuTriangleAlert />,
                title: "Incidentes",
                panelView: 'Incidentes',
                activeOnPanelViews: ['Nuevo Incidente']
            },
            {
                icon: <LuTent />,
                title: "Refugios",
                onClick: () => {}
            },
            {
                icon: <LuTrendingUp />,
                title: "Riesgo",
                onClick: () => {}
            },
            {
                icon: <LuUsers />,
                title: "Usuarios",
                onClick: () => {}
            },
            {
                icon: <LuSun/>,
                title: "Ajustes",
                panelView: 'Ajustes'
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
    {navItems.map((item, idx) => {
                const panelView = item.panelView
                const onClick = panelView ? () => setPanelView(panelView) : item.onClick
                // Las secciones que abren un panel se marcan mientras su panel está abierto; las demás, por la ruta.
                const isActive = panelView
                    ? currentPanelView === panelView || (!!currentPanelView && !!item.activeOnPanelViews?.includes(currentPanelView))
                    : currentPath === item.destinationPath

                return (
                <Fragment key={idx}>
                    {item.destinationPath && !onClick &&
                        <Link
                            className={navItemStyle(isActive)}
                            to={item.destinationPath}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <NavItemContent {...item} />
                        </Link>
                    }
                    {!item.destinationPath && onClick &&
                        <button
                            type="button"
                            className={navItemStyle(isActive)}
                            onClick={onClick}
                            aria-pressed={isActive}
                        >
                            <NavItemContent {...item} />
                        </button>
                    }
                </Fragment>
                )
            })}
        </section>
    )
}