import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            "font-size": [{ text: ["caption", "body"] }], // AQUI SE DEBEN PONER LOS TAMAÑOS PERSONALIZADOS PARA QUE CN LOS ACEPTE
        },
    },
});

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}