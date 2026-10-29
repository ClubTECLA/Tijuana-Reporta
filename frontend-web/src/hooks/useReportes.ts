import { useContext } from "react";
import { ReportesContext } from "./contexts/ReportesContext.ts";

export const useReportes = () => {
    const context = useContext(ReportesContext);

    if (context === undefined) {
        throw new Error("useReportes must be used within a ReportesProvider");
    }

    return context;
};
