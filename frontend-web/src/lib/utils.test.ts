import { describe, expect, it, vi } from "vitest";
import { addRecentSearch, traducirTipoPhoton } from "./utils";
import type { SearchStorageType } from "@/types/localStorage-types";
import type { Dispatch, SetStateAction } from "react";

describe("traducirTipoPhoton", () => {
    it("traduce los tipos de Photon al español", () => {
        expect(traducirTipoPhoton("street")).toBe("Calle");
        expect(traducirTipoPhoton("locality")).toBe("Localidad");
        expect(traducirTipoPhoton("county")).toBe("Municipio");
    });

    it("conserva tipos desconocidos y usa una etiqueta para valores faltantes", () => {
        expect(traducirTipoPhoton("custom-place")).toBe("custom-place");
        expect(traducirTipoPhoton(undefined)).toBe("Lugar");
    });

    it("agrega la búsqueda reciente mediante el setter recibido", () => {
        const storage: SearchStorageType = {
            recent_searches: ["Calle Primera"],
            current_location_suggestions: [],
            selected_recent_search: "",
            current_query: "",
        };
        const setSearchStorage = vi.fn<Dispatch<SetStateAction<SearchStorageType>>>((update) => {
            const next = typeof update === "function" ? update(storage) : update;
            expect(next.recent_searches).toEqual(["Zona Centro", "Calle Primera"]);
        });

        addRecentSearch(" Zona Centro ", setSearchStorage);

        expect(setSearchStorage).toHaveBeenCalledOnce();
    });
});
