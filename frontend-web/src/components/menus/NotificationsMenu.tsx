import { useState } from "react";
import { SegmentedTabs, TabItem } from "../CommonPanel/PanelComponents/view-components/SegmentedTabs";
import { type NotiType, NotiIcons } from "../../types/utils-types";
import { FiSun } from "react-icons/fi";

interface NotiProps {
    title: string;
    description?: string;
    type: NotiType;
    read: boolean;
    id: number;
    created_at: string;
    onClick?: () => void
}

function NotificationItem ( { title, description, type, read, id, created_at, onClick } : NotiProps ) {
    const getTimeSinceCreated = (createdAt: string): string => {
        const elapsedSeconds = Math.max(
            0,
            Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000),
        );

        if (elapsedSeconds < 60) {
            return `hace ${elapsedSeconds} seg`;
        }

        const elapsedMinutes = Math.floor(elapsedSeconds / 60);
        if (elapsedMinutes < 60) {
            return `hace ${elapsedMinutes} min`;
        }

        const elapsedHours = Math.floor(elapsedMinutes / 60);
        return `hace ${elapsedHours} hrs`;
    };

    void getTimeSinceCreated;

    const NotiIconWrapped = {
        'report': 'bg-blue-100 text-blue-600 ',
        'moderation': 'bg-red-100 text-red-600',
        'system': 'bg-gray-200 text-gray-600' 
    } as const satisfies Record<NotiType, string> 
    
    return(
        <div
            data-notification-id={id}
            data-created-at={created_at}
            className={`
                flex flex-row gap-2 
                items-center bg-white 
                rounded-2xl p-2
                hover:bg-gray-200 transition-all duration-300
            `}
            onClick={onClick}
        >
            <div 
                className={`
                    flex flex-row items-center justify-center
                    text-2xl 
                    rounded-full p-2 w-10 h-10
                    ${NotiIconWrapped[type]}
                `}
            >
                {NotiIcons[type]}
            </div>
            <div className={`flex flex-col`}>
                <div className="flex flex-row justify-between items-center gap-2">
                    <h3 className="text-md font-bold text-gray-800">{title}</h3>
                    <span className="text-xs font-semibold text-gray-500">{getTimeSinceCreated(created_at)}</span>
                </div>
                {description && <p className="text-sm text-gray-700">{description}</p>}
            </div>
            {!read && 
                <div className="flex flex-col items-start justify-start h-15">
                    <span className="bg-blue-700 rounded-full w-2 h-2"/>
                </div>
            }
        </div>
    )
}


export default function NotificationsMenu() {
    const [notifications, setNotifications] = useState<NotiProps[]>([
        { id: 1, title: "Nuevo reporte disponible", description: "Hay un nuevo reporte disponible para revisar.", type: "report", read: false, created_at: "2026-10-03T21:45:00.000Z" },
        { id: 2, title: "Tu reporte ha sido aprobado", description: "Tu reporte ha sido aprobado por el equipo de moderación.", type: "moderation", read: true, created_at: "2026-10-03T20:30:00.000Z" },
        { id: 3, title: "Actualización del sistema", description: "Se ha realizado una actualización del sistema.", type: "system", read: false, created_at: "2026-10-03T19:15:00.000Z" },
        { id: 4, title: "Reporte asignado a tu equipo", description: "Se asignó un reporte de bache en la colonia Centro.", type: "report", read: false, created_at: "2026-10-03T18:40:00.000Z" },
        { id: 5, title: "Reporte marcado como duplicado", description: "El reporte #2481 coincide con un incidente existente.", type: "moderation", read: true, created_at: "2026-10-03T17:55:00.000Z" },
        { id: 6, title: "Mantenimiento programado", description: "El sistema tendrá mantenimiento esta noche a las 23:00.", type: "system", read: false, created_at: "2026-10-03T16:20:00.000Z" },
        { id: 7, title: "Nuevo reporte de alumbrado", description: "Se reportó una luminaria apagada en Playas de Tijuana.", type: "report", read: true, created_at: "2026-10-03T15:10:00.000Z" },
        { id: 8, title: "Contenido revisado", description: "La actualización del reporte fue aprobada.", type: "moderation", read: false, created_at: "2026-10-03T14:35:00.000Z" },
        { id: 9, title: "Política de privacidad actualizada", description: "Consulta los cambios en la política de privacidad.", type: "system", read: true, created_at: "2026-10-03T13:00:00.000Z" },
        { id: 10, title: "Reporte cercano a tu zona", description: "Hay un incidente nuevo a menos de 2 km de tu ubicación.", type: "report", read: false, created_at: "2026-10-03T11:25:00.000Z" },
        { id: 11, title: "Reporte cerrado", description: "El incidente de recolección de basura se marcó como resuelto.", type: "moderation", read: true, created_at: "2026-10-03T10:50:00.000Z" },
        { id: 12, title: "Cambios guardados", description: "Se actualizaron las preferencias de notificaciones.", type: "system", read: false, created_at: "2026-10-03T09:30:00.000Z" },
        { id: 13, title: "Nuevo reporte de bache", description: "Se recibió un reporte en la colonia Zona Río.", type: "report", read: true, created_at: "2026-10-03T08:15:00.000Z" },
    ]); 

    const [ typeFilter, setTypeFilter] = useState<NotiType | null>(null);

    const handleClickNoti = (notiKey: number) => {
        setNotifications((prev) => prev.map((noti) => noti.id === notiKey ? {...noti, read: true} : noti))
        
        //Change read state in db
    }

    const markAllReaded = () => {
        setNotifications(prev => prev.map(noti => ({...noti, read: true})))
    }
   
    return (
        <section
            className="
                fixed right-5 top-20
                max-w-100 w-100
                pointer-events-auto
                flex h-[32rem] max-h-[calc(100vh-6rem)] flex-col
                p-4 rounded-3xl shadow-lg shadow-gray-600
                overflow-hidden
                bg-gray-100 
            "
        >
            <div className="flex flex-row justify-between  px-2 pt-1">
                <h1 className="font-bold text-gray-800 text-xl">Notificaciones</h1>
                <button
                    className="text-blue-600 text-sm font-semibold hover:underline underline-offset-4"
                    onClick={markAllReaded}
                >
                    Marcar leidas
                </button>
            </div>
            <SegmentedTabs
                format="row"
            >
                <TabItem
                    tabTitle="Todas"
                    format="row"
                    onClick={() => setTypeFilter(null)}
                />
                <TabItem
                    tabTitle="Reportes"
                    format="row"
                    onClick={() => setTypeFilter('report')}
                />
                <TabItem
                    tabTitle="Moderación"
                    format="row"
                    onClick={() => setTypeFilter('moderation')}
                />
                <TabItem
                    tabTitle="Sistema"
                    format="row"
                    onClick={() => setTypeFilter('system')}
                />
            </SegmentedTabs>

            <div className="
                    flex min-h-0 flex-1 flex-col gap-2
                    p-2 rounded-2xl 
                    overflow-y-auto
                "
            >
                {notifications.map((noti) => {
                    
                    if(typeFilter === null || noti.type === typeFilter){
                        return(
                            <NotificationItem
                                title={noti.title}
                                description={noti.description}
                                key={noti.id}
                                id={noti.id}
                                type={noti.type}
                                read={noti.read}
                                created_at={noti.created_at}
                                onClick={() => handleClickNoti(noti.id)}
                            />
                        )    
                    }

                })}
            </div>
            <button
                className="
                    flex flex-row items-center 
                    justify-center w-full
                    text-blue-500 font-semibold 
                    mt-4 gap-2 group
                "
            >
                <FiSun />
                <p className="group-hover:underline underline-offset-2">
                    Preferencias de Notificaciones
                </p>
            </button>
        </section>
    )
}