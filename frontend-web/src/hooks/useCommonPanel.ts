import { useContext } from "react";
import { CommonPanelContext } from "./contexts/CommonPanelContext";

export const useCommonPanel = () => {
    const context = useContext(CommonPanelContext);

    if (context === undefined) {
        throw new Error("useCommonPanel must be used within a CommonPanelProvider");
    }

    return context;
};