import { useContext } from "react";
import { ReportesContext } from "./contexts/ReportesContext";

export const useReportes = () => {
    const context = useContext(ReportesContext);

    if (context === undefined) {
        throw new Error("useReportes must be used within a ReportesProvider");
    }

    return context;
};
