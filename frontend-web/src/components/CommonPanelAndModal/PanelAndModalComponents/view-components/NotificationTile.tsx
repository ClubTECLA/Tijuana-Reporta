import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import { NotiIcons, type NotiType, type subsectionProps } from "../../../../types/utils-types";
import SubSection from "../primitive-components/SubSection";

interface NotificationTileProps extends subsectionProps {
    title: string;
    description?: string;
    type: NotiType;
    read: boolean;
    id: number;
    createdAt: string;
    onClick?: () => void;
}

const iconStyles = {
    report: "bg-blue-100 text-blue-600",
    moderation: "bg-red-100 text-red-600",
    system: "bg-gray-200 text-gray-600",
} as const satisfies Record<NotiType, string>;

function getTimeSinceCreated(createdAt: string): string {
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

    return `hace ${Math.floor(elapsedMinutes / 60)} hrs`;
}

export function NotificationTile({
    title,
    description,
    type,
    read,
    id,
    createdAt,
    onClick,
    format,
    debug
}: NotificationTileProps) {
    return (
        <SubSection
            type="button"
            format={format}
            debug={debug}
            onClick={onClick}
            className="
                items-center gap-2 rounded-2xl bg-white p-2 text-left
                transition-colors hover:bg-gray-200 w-full
            "
        >
            <span className="sr-only">Notificación {id}</span>
            <span
                aria-hidden="true"
                className={`
                    flex size-10 shrink-0 items-center justify-center
                    rounded-full p-2 text-2xl ${iconStyles[type]}
                `}
            >
                {NotiIcons[type]}
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex min-w-0 flex-wrap items-center justify-between gap-x-2">
                    <span className="min-w-0 break-words font-bold text-gray-800">{title}</span>
                    <time
                        dateTime={createdAt}
                        className="shrink-0 text-xs font-semibold text-gray-500"
                    >
                        {getTimeSinceCreated(createdAt)}
                    </time>
                </span>
                {description && (
                    <span className="block break-words text-sm text-gray-700">
                        {description}
                    </span>
                )}
            </span>
            {!read && (
                <span className="flex h-15 flex-col items-start justify-start">
                    <span className="size-2 rounded-full bg-blue-700" />
                    <span className="sr-only">No leída</span>
                </span>
            )}
        </SubSection>
    );
}

interface NotificationListProps extends subsectionProps {
    children: ReactNode
}

export function NotificationList({format = 'both-fit', debug, children} : NotificationListProps) {
    return(
        <SubSection
            format={format}
            debug={debug}
            className=" overflow-auto max-w-full max-h-60 flex-col"
        >
            {Children.map(children, (child) => {
                if(!isValidElement<NotificationTileProps>(child)){
                    throw new Error("NotificationList only accept NotificationTile components");
                }

                return cloneElement(child, {
                    debug: debug || child.props.debug
                })
            })}
        </SubSection>
    )
}
