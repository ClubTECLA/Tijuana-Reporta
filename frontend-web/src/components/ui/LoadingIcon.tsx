import { LuLoaderCircle } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface LoadingIconProps {
    className?: string;
    label?: string;
}

export default function LoadingIcon({ className, label = "Cargando" }: LoadingIconProps) {
    return (
        <LuLoaderCircle
            role="status"
            aria-label={label}
            className={cn("size-6 animate-spin text-brand-text motion-reduce:animate-none", className)}
        />
    );
}
