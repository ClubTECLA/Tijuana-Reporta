import { Fragment, type ReactNode } from "react"
import { useRouter } from "@/lib/useRouter"
import { Link } from "react-router-dom"

//import icons
import { LuMap, LuSun, LuTent, LuTrendingUp, LuTriangleAlert, LuUsers } from "react-icons/lu"
import type { NavItemsType } from "@/types/utils-types"
import { useCommonPanel } from "@/panels/useCommonPanel"
import { cn } from "@/lib/utils"


const navItemStyle = (isActive: boolean) => `
    flex h-11 shrink-0 flex-row items-center gap-2
    rounded-full px-4 text-sm
    transition-colors duration-200
    ${isActive ? 
        'bg-ink-strong font-bold text-white' 
        : 
        'font-semibold text-icon hover:bg-subtle'
    }
`

function NavItemContent({ icon, title, cantNoti }: { icon: ReactNode, title: string, cantNoti?: number }) {
    return (
        <>
            <span className="text-lg">{icon}</span>
            {/* Solo icono cuando el texto no cabe (por debajo de 768 px, en su propia fila; de 1024 a 1366 px, junto
                al buscador y el perfil), con el nombre para lectores de pantalla y en el title del botón. */}
            <span className="max-md:sr-only lg:max-[1366px]:sr-only">{title}</span>
            {!!cantNoti &&
                <span className="rounded-full bg-report px-1.75 py-px text-2xs font-bold text-white">{cantNoti}</span>
            }
        </>
    )
}
/** className: p. ej. la fila propia de teléfono y tablet, que la extiende a todo el ancho. */
export default function NavBar({ className }: { className?: string }) {
    const { currentPanelView, openPanel } = useCommonPanel();

    const router = useRouter();
    const currentPath = router.pathname;
    
    const navItems: NavItemsType = [
            {
                icon: <LuMap/>,
                title: "Resumen",
                panelView: 'Resumen'
            },
            {
                icon: <LuTriangleAlert />,
                title: "Incidentes",
                panelView: 'Incidentes',
                activeOnPanelViews: ['Nuevo Incidente', 'Detalle Incidente']
            },
            {
                icon: <LuTent />,
                title: "Centros",
                panelView: 'Centros',
                activeOnPanelViews: ['Detalle Centro', 'Nuevo Centro']
            },
            {
                icon: <LuTrendingUp />,
                title: "Riesgo",
                onClick: () => {}
            },
            {
                icon: <LuUsers />,
                title: "Usuarios",
                panelView: 'Usuarios',
            },
            {
                icon: <LuSun/>,
                title: "Ajustes",
                panelView: 'Ajustes'
            }
        ]

    return(
        <section
            className={cn(`
                mx-auto flex h-14 w-fit max-w-full flex-row items-center gap-0.5 p-1
                overflow-x-auto scrollbar-none
                rounded-full border border-glass-line bg-white
                font-['Plus_Jakarta_Sans',sans-serif]
                shadow-soft
            `, className)}
        >
                {navItems.map((item, idx) => {
                const panelView = item.panelView
                const onClick = panelView ? () => openPanel(panelView) : item.onClick
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
                            title={item.title}
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
                            title={item.title}
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