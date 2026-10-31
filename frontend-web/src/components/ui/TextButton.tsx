import type { ReactNode } from "react";
import type { subsectionProps } from "@/types/utils-types";
import SubSection from "@/components/layout/SubSection";

interface TextButtonProps extends subsectionProps {
    title: string;
    icon?: ReactNode;
    onClick?: () => void;
    className?: string;
}

export default function TextButton({
    title,
    icon,
    onClick,
    className,
    debug,
    format = "row",
}: TextButtonProps) {
    return (
        <SubSection
            as="button"
            format={format}
            debug={debug}
            onClick={onClick}
            className={`
                items-center justify-center gap-2
                bg-transparent font-semibold
                ${className ?? ""}
            `}
        >
            {icon != null && <span>{icon}</span>}
            <span>{title}</span>
        </SubSection>
    );
}
