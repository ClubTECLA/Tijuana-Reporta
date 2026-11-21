import { useContext } from "react";
import { CentrosContext } from "./CentrosContext.ts";

export const useCentros = () => {
    const context = useContext(CentrosContext);

    if (context === undefined) {
        throw new Error("useCentros must be used within a CentrosProvider");
    }

    return context;
};
