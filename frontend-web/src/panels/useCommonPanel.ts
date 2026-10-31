import { useContext } from "react";
import { CommonPanelContext } from "./CommonPanelContext.ts";

export const useCommonPanel = () => {
    const context = useContext(CommonPanelContext);

    if (context === undefined) {
        throw new Error("useCommonPanel must be used within a CommonPanelProvider");
    }

    return context;
};