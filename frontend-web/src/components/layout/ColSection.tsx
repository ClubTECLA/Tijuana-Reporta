import { Children, cloneElement, Fragment, isValidElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";
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

const SIZING_PATTERN =
    /^(?:w-|h-|min-w-|min-h-|max-w-|max-h-|size-|basis-|grow(?:-|$)|shrink(?:-|$)|flex-(?:1|auto|initial|none)$)/;

function splitClassName(className?: string) {
    const sizing: string[] = [];
    const rest: string[] = [];

    for (const cls of className?.split(/\s+/).filter(Boolean) ?? []) {
        // Quita variantes (sm:, max-sm:, hover:) y el prefijo important (!)
        const utility = (cls.split(":").pop() ?? cls).replace(/^!/, "");
        (SIZING_PATTERN.test(utility) ? sizing : rest).push(cls);
    }

    return { sizing: sizing.join(" "), rest: rest.join(" ") };
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
        const { sizing, rest } = splitClassName(className);

        return (
            <section className={cn("flex flex-col justify-between", sizing, debug && "border-2")}>
                <div
                    className={cn(
                        "flex flex-col items-center max-w-full max-h-full",
                        arrangementNormalize[arrangementSubsections],
                        brd,
                        debug && "border-2 border-red-500",
                        rest,
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
            className={cn(
                "w-fit h-full min-h-0 flex flex-col max-h-full max-w-full justify-between",
                debug && "border-2",
                brd,
            )}
        >
            <div className={cn("w-fit flex-1 min-h-0 flex flex-col max-w-full", debug && "border-2 border-green-500")}>
                <PanelHeader title={title} subtitle={subtitle} actions={headerActions} />
                <div
                    className={cn(
                        "max-w-full max-h-full min-h-0 mt-5 flex flex-col overflow-y-auto",
                        arrangementNormalize[arrangementSubsections],
                        debug && "border-2 border-red-500",
                        className,
                    )}
                >
                    {content}
                </div>
            </div>
            <div className={cn("shrink-0", debug && "border-2 border-blue-500")}>
                <PanelFooter element={footerElement} />
            </div>
        </section>
    );
}