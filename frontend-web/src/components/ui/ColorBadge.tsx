import SubSection from "@/components/layout/SubSection";

const ColorBadgeColors = {
    blue: {
        background: "bg-brand-subtle",
        text: "text-brand-text",
        dot: "bg-brand",
    },
    amber: {
        background: "bg-warning-subtle",
        text: "text-warning",
        dot: "bg-warning",
    },
    green: {
        background: "bg-success-subtle",
        text: "text-success",
        dot: "bg-success",
    },
    red: {
        background: "bg-danger-subtle",
        text: "text-danger",
        dot: "bg-danger",
    },
    gray: {
        background: "bg-canvas",
        text: "text-ink-secondary",
        dot: "bg-ink-secondary",
    },
} as const;

export type ColorBadgeColor = keyof typeof ColorBadgeColors;

interface ColorBadgeProps {
    color: ColorBadgeColor;
    text: string;
}

export default function ColorBadge({ color, text }: ColorBadgeProps) {
    const colors = ColorBadgeColors[color];

    return (
        <SubSection
            as="span"
            format="row"
            aria-label={text}
            className={`items-center gap-2 rounded-full px-4 py-2 text-caption font-semibold whitespace-nowrap ${colors.background} ${colors.text}`}
        >
            <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${colors.dot}`} />
            {text}
        </SubSection>
    );
}
