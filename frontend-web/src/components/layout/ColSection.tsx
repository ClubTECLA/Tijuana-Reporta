import { Children, cloneElement, Fragment, isValidElement, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import PanelHeader from "./PanelHeader";
import PanelFooter from "./PanelFooter";
import { borders, type SectionProps } from "@/types/utils-types";

const arrangementNormalize = {
    toDown: "justify-start h-fit",
    toUp: "justify-end h-full",
    center: "justify-center h-full",
    between: "justify-between h-full",
} as const satisfies Record<string, string>;

interface ColSectionProps extends SectionProps {
    arrangementSubsections?: keyof typeof arrangementNormalize;
}

function propagateDebug(children: ReactNode, debug: boolean) {
    return Children.map(children, (child) => {
        if (
            isValidElement<{ debug?: boolean }>(child) &&
            typeof child.type !== "string" &&
            child.type !== Fragment
        ) {
            return cloneElement(child, { debug: debug || child.props.debug });
        }
        return child;
    });
}

export default function ColSection({
    children,
    arrangementSubsections = "toDown",
    debug = false,
    title,
    subtitle,
    headerActions,
    className,
    footerElement,
    border,
}: ColSectionProps) {
    const brd = border?.length
        ? `${border.map((b) => borders[b]).join(" ")} border-line`
        : "";

    const content = propagateDebug(children, debug);
    const footer = (
        <div className={debug ? "border-2 border-blue-500" : ""}>
            <PanelFooter element={footerElement} />
        </div>
    );

    if (!title) {
        return (
            <section className={clsx("flex flex-col justify-between", debug && "border-2")}>
                <div
                    className={twMerge(
                        "flex flex-col items-center max-w-full max-h-full",
                        arrangementNormalize[arrangementSubsections],
                        brd,
                        debug && "border-2 border-red-500",
                        className
                    )}
                >
                    {content}
                </div>
                {footer}
            </section>
        );
    }

    return (
        <section
            className={clsx(
                "w-fit h-full flex flex-col max-h-full max-w-full justify-between",
                debug && "border-2",
                brd
            )}
        >
            <div className={clsx("w-fit h-full flex flex-col max-h-full max-w-full", debug && "border-2 border-green-500")}>
                <PanelHeader title={title} subtitle={subtitle} actions={headerActions} />
                <div
                    className={twMerge(
                        "max-w-full max-h-full mt-5 flex flex-col",
                        arrangementNormalize[arrangementSubsections],
                        debug && "border-2 border-red-500",
                        className
                    )}
                >
                    {content}
                </div>
            </div>
            {footer}
        </section>
    );
}