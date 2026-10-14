import { useState } from "react";
import { SegmentedTabs, TabItem } from "../CommonPanelAndModal/PanelAndModalComponents/view-components/SegmentedTabs";
import { type NotiType } from "../../types/utils-types";
import { FiSun } from "react-icons/fi";
import {NotificationTile, NotificationList} from "../CommonPanelAndModal/PanelAndModalComponents/view-components/NotificationTile";
import TextButton from "../CommonPanelAndModal/PanelAndModalComponents/view-components/TextButton";
import RowSection from "../CommonPanelAndModal/PanelAndModalComponents/primitive-components/RowSection";
import SubsectionTitle from "../CommonPanelAndModal/PanelAndModalComponents/view-components/SubsectionTitle";
import ColSection from "../CommonPanelAndModal/PanelAndModalComponents/primitive-components/ColSection";

interface NotiProps {
    title: string;
    description?: string;
    type: NotiType;
    read: boolean;
    id: number;
    created_at: string;
    onClick?: () => void
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
        <ColSection
            className="px-4"
        >
            <RowSection
                className="px-2 pt-1"
                arrangementSubsections='between'
            >
                <SubsectionTitle 
                    title="Notificaciones"
                />
                <TextButton
                    title="Marcar leídas"
                    onClick={markAllReaded}
                    className="text-sm text-blue-600 hover:underline underline-offset-4"
                />
            </RowSection>
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

            <NotificationList
                format='col'
            >
                {notifications
                    .filter((noti) => typeFilter === null || noti.type === typeFilter)
                    .map((noti) => (
                        <NotificationTile
                            title={noti.title}
                            description={noti.description}
                            key={noti.id}
                            id={noti.id}
                            type={noti.type}
                            read={noti.read}
                            createdAt={noti.created_at}
                            onClick={() => handleClickNoti(noti.id)}
                        />
                    ))}
            </NotificationList>
            <TextButton
                title="Preferencias de Notificaciones"
                icon={<FiSun />}
                format="col"
                className="mt-4 w-full text-blue-500 hover:underline underline-offset-2 mb-4"
            />
        </ColSection>
    )
}