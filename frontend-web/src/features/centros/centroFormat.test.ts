import { describe, expect, it } from "vitest";
import { DEFAULT_CENTRO_FILTERS, estaOcupado, filterCentros, lugaresDisponibles, lugaresTexto } from "./centroFormat";
import type { ApiCentro } from "@/types/api-types";

const centro = (id: string, tipo_centro: number, capacidad: number | null, cantidad: number | null) =>
    ({ id, tipo_centro, capacidad, cantidad }) as ApiCentro;

const centros = [
    centro("libre", 1, 50, 20),
    centro("lleno", 1, 30, 30),
    centro("sin-capacidad", 2, null, null),
    centro("otro-tipo-lleno", 2, 10, 12),
];
const ids = (list: ApiCentro[]) => list.map((item) => item.id);

describe("lugaresDisponibles", () => {
    it("es la capacidad menos la gente que hay, sin bajar de 0", () => {
        expect(lugaresDisponibles({ capacidad: 50, cantidad: 20 })).toBe(30);
        expect(lugaresDisponibles({ capacidad: 10, cantidad: 12 })).toBe(0);
    });

    it("sin capacidad o sin cantidad no se puede saber", () => {
        expect(lugaresDisponibles({ capacidad: null, cantidad: 3 })).toBeNull();
        expect(lugaresDisponibles({ capacidad: 40, cantidad: null })).toBeNull();
    });
});

describe("estaOcupado", () => {
    it("solo sin lugares libres; sin capacidad registrada cuenta como disponible", () => {
        expect(estaOcupado({ capacidad: 30, cantidad: 30 })).toBe(true);
        expect(estaOcupado({ capacidad: 30, cantidad: 29 })).toBe(false);
        expect(estaOcupado({ capacidad: null, cantidad: null })).toBe(false);
    });
});

describe("filterCentros", () => {
    it("de entrada muestra los disponibles de todos los tipos", () => {
        expect(ids(filterCentros(centros, DEFAULT_CENTRO_FILTERS))).toEqual(["libre", "sin-capacidad"]);
    });

    it("separa ocupados y todos, y oculta los tipos apagados", () => {
        expect(ids(filterCentros(centros, { tab: "ocupados", hiddenTipos: [] }))).toEqual(["lleno", "otro-tipo-lleno"]);
        expect(ids(filterCentros(centros, { tab: "todos", hiddenTipos: [2] }))).toEqual(["libre", "lleno"]);
    });
});

describe("lugaresTexto", () => {
    it("usa el singular con un lugar", () => {
        expect(lugaresTexto(1)).toBe("1 lugar disponible");
        expect(lugaresTexto(0)).toBe("0 lugares disponibles");
    });
});
