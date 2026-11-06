import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            "font-size": [{ text: ["2xs", "caption", "body", "title"] }], // AQUI SE DEBEN PONER LOS TAMAÑOS PERSONALIZADOS PARA QUE CN LOS ACEPTE
        },
    },
});

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}