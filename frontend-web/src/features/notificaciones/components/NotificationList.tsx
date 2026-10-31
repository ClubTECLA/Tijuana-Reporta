import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import { NotiIcons, type NotiType, type subsectionProps } from "@/types/utils-types";
import SubSection from "@/components/layout/SubSection";

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
    report: "bg-brand-subtle text-brand",
    moderation: "bg-danger-subtle text-danger",
    system: "bg-canvas text-ink-secondary",
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

    const elapsedHours = Math.floor(elapsedMinutes / 60); 
    if(elapsedHours < 24){
        return `hace ${elapsedHours} hrs`
    }
    return `hace ${Math.floor(elapsedHours / 24)} d`;
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
            as="button"
            format={format}
            debug={debug}
            onClick={onClick}
            className="
                items-center gap-2 rounded-2xl bg-white p-2 text-left
                transition-colors hover:bg-canvas w-full
            "
        >
            <SubSection 
                as='span'
                className="sr-only">Notificación {id}</SubSection>
            <SubSection
                as='span'
                aria-hidden="true"
                className={`
                    flex size-10 shrink-0 items-center justify-center
                    rounded-full p-2 text-2xl ${iconStyles[type]}
                `}
            >
                {NotiIcons[type]}
            </SubSection>
            <SubSection 
                as='span'
                className="flex flex-col min-w-0 flex-1"
            >
                <SubSection 
                    as='span'
                    className="flex min-w-0 flex-wrap items-center justify-between gap-x-2"
                >
                    <SubSection 
                        as='span'
                        className="min-w-0 break-words font-bold text-ink"
                    >{title}</SubSection>
                    <time
                        dateTime={createdAt}
                        className="shrink-0 text-xs font-semibold text-ink-muted"
                    >
                        {getTimeSinceCreated(createdAt)}
                    </time>
                </SubSection>
                {description && (
                    <SubSection 
                        as='span'
                        className="block break-words text-sm text-ink"
                    >
                        {description}
                    </SubSection>
                )}
            </SubSection>
            {!read && (
                <SubSection 
                    as='span'
                    format="nothing" 
                    className="h-15 flex-col items-start justify-start"
                >
                    <SubSection as='span' className="size-2 rounded-full bg-brand" />
                    <SubSection as='span' className="sr-only">No leída</SubSection>
                </SubSection>
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
