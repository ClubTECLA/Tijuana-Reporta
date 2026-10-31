import { describe, expect, it, vi } from "vitest";
import { publicarReporte, type NuevoReporte } from "./publicarReporte";
import type { ApiCrearReporteResponse } from "@/types/api-types";

const nuevo: NuevoReporte = { categoriaId: 3, latitude: 32.5, longitude: -117.0, descripcion: "  Calle inundada  " };
const creado = { id: "r1" } as ApiCrearReporteResponse;

// API falsa: cada llamada se puede hacer fallar por separado.
function fakeApi({ crear = true, comentario = true, estado = true } = {}) {
    return {
        crearReporte: vi.fn(async () => {
            if (!crear) throw new Error("No se pudo crear");
            return creado;
        }),
        crearComentario: vi.fn(async () => {
            if (!comentario) throw new Error("fallo");
            return {} as never;
        }),
        cambiarEstadoReporte: vi.fn(async () => {
            if (!estado) throw new Error("fallo");
            return {} as never;
        }),
    };
}

describe("publicarReporte", () => {
    it("crea el reporte, guarda la descripción recortada y lo verifica", async () => {
        const api = fakeApi();

        const result = await publicarReporte(nuevo, api);

        expect(result).toEqual({ reporte: creado, pendientes: [] });
        expect(api.crearReporte).toHaveBeenCalledWith({ incidente_id: 3, latitude: 32.5, longitude: -117.0 });
        expect(api.crearComentario).toHaveBeenCalledWith("r1", "Calle inundada");
        expect(api.cambiarEstadoReporte).toHaveBeenCalledWith("r1", "Verificado");
    });

    it("sin descripción no crea comentario", async () => {
        const api = fakeApi();

        await publicarReporte({ ...nuevo, descripcion: "   " }, api);

        expect(api.crearComentario).not.toHaveBeenCalled();
        expect(api.cambiarEstadoReporte).toHaveBeenCalledOnce();
    });

    it("si falla un paso posterior, el reporte queda publicado y el paso se devuelve como pendiente", async () => {
        const api = fakeApi({ comentario: false, estado: false });

        const result = await publicarReporte(nuevo, api);

        expect(result.reporte).toBe(creado);
        expect(result.pendientes).toEqual(["la descripción no se pudo guardar", "no se pudo marcar como verificado"]);
    });

    it("si falla crearlo, lanza el error y no sigue", async () => {
        const api = fakeApi({ crear: false });

        await expect(publicarReporte(nuevo, api)).rejects.toThrow("No se pudo crear");

        expect(api.crearComentario).not.toHaveBeenCalled();
        expect(api.cambiarEstadoReporte).not.toHaveBeenCalled();
    });
});
