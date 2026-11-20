import { useContext } from "react";
import { RiesgoContext } from "./RiesgoContext.ts";

export const useRiesgo = () => {
    const context = useContext(RiesgoContext);

    if (context === undefined) {
        throw new Error("useRiesgo must be used within a RiesgoProvider");
    }

    return context;
};
