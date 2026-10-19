import type { subsectionProps } from "../../../../types/utils-types";
import SubSection from "../primitive-components/SubSection";

interface subsectionTitleProps extends subsectionProps {
    title: string,
    description?: string
}

export default function SubsectionTitle ({ format, debug, title, description} : subsectionTitleProps) {
    return(
        <SubSection
            format={format}
            debug={debug}
            className="flex-col"
        >
            <p
                className="text-ink text-lg font-bold"
            >{title}</p>
            {description && 
                <a
                    className="text-xs text-ink-muted "
                >{description}</a>
            }
        </SubSection>
    )
}