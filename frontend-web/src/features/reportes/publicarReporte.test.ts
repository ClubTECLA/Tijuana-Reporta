import { describe, expect, it, vi } from "vitest";
import { falloFoto, publicarReporte, subirFoto, type NuevoReporte } from "./publicarReporte";
import type { ApiCrearReporteResponse } from "@/types/api-types";

const nuevo: NuevoReporte = {
    categoriaId: 3,
    latitude: 32.5,
    longitude: -117.0,
    direccion: "  Calle Cañón Zacatecas · México  ",
    descripcion: "  Calle inundada  ",
};
const creado = { id: "r1" } as ApiCrearReporteResponse;
const foto = new Blob(["jpeg"], { type: "image/jpeg" });
// Como los errores de lib/http: el mensaje del backend y el código HTTP.
const httpError = (status: number) => Object.assign(new Error("fallo"), { status });

// API falsa: cada llamada se puede hacer fallar por separado; `multimedia` puede ser un código HTTP.
function fakeApi({ crear = true, comentario = true, estado = true, multimedia = true as boolean | number } = {}) {
    const step = (works: boolean | number) => vi.fn(async () => {
        if (works === false) throw new Error("fallo");
        if (typeof works === "number") throw httpError(works);
        return {} as never;
    });
    return {
        crearReporte: vi.fn(async () => {
            if (!crear) throw new Error("No se pudo crear");
            return creado;
        }),
        crearComentario: step(comentario),
        cambiarEstadoReporte: step(estado),
        subirMultimedia: step(multimedia),
    };
}

describe("publicarReporte", () => {
    it("crea el reporte oficial con su dirección, guarda la descripción recortada, lo verifica y sube la foto", async () => {
        const api = fakeApi();

        const result = await publicarReporte({ ...nuevo, foto }, api);

        expect(result).toEqual({ reporte: creado, pendientes: [], falloFoto: null });
        expect(api.crearReporte).toHaveBeenCalledWith({
            incidente_id: 3, latitude: 32.5, longitude: -117.0, es_oficial: true, direccion: "Calle Cañón Zacatecas · México",
        });
        expect(api.crearComentario).toHaveBeenCalledWith("r1", "Calle inundada");
        expect(api.cambiarEstadoReporte).toHaveBeenCalledWith("r1", "Verificado");
        expect(api.subirMultimedia).toHaveBeenCalledWith("r1", foto);
    });

    it("sin descripción, dirección ni foto no las envía", async () => {
        const api = fakeApi();

        await publicarReporte({ ...nuevo, descripcion: "   ", direccion: " " }, api);

        expect(api.crearReporte).toHaveBeenCalledWith(expect.objectContaining({ direccion: undefined }));
        expect(api.crearComentario).not.toHaveBeenCalled();
        expect(api.subirMultimedia).not.toHaveBeenCalled();
        expect(api.cambiarEstadoReporte).toHaveBeenCalledOnce();
    });

    it("recorta la dirección al límite del backend", async () => {
        const api = fakeApi();

        await publicarReporte({ ...nuevo, direccion: "a".repeat(300) }, api);

        expect(api.crearReporte).toHaveBeenCalledWith(expect.objectContaining({ direccion: "a".repeat(255) }));
    });

    it("si falla un paso posterior, el reporte queda publicado y el paso se devuelve como pendiente", async () => {
        const api = fakeApi({ comentario: false, estado: false, multimedia: 503 });

        const result = await publicarReporte({ ...nuevo, foto }, api);

        expect(result.reporte).toBe(creado);
        expect(result.pendientes).toEqual(["la descripción no se pudo guardar", "no se pudo marcar como verificado"]);
        expect(result.falloFoto).toEqual({ motivo: "el almacenamiento de fotos no está disponible", reintentable: true });
    });

    it("si falla crearlo, lanza el error y no sigue", async () => {
        const api = fakeApi({ crear: false });

        await expect(publicarReporte({ ...nuevo, foto }, api)).rejects.toThrow("No se pudo crear");

        expect(api.crearComentario).not.toHaveBeenCalled();
        expect(api.cambiarEstadoReporte).not.toHaveBeenCalled();
        expect(api.subirMultimedia).not.toHaveBeenCalled();
    });
});

describe("subirFoto", () => {
    it("solo sube la foto del reporte indicado, sin crear otro", async () => {
        const api = fakeApi();

        expect(await subirFoto("r1", foto, api)).toBeNull();

        expect(api.subirMultimedia).toHaveBeenCalledWith("r1", foto);
        expect(api.crearReporte).not.toHaveBeenCalled();
    });

    it("un 409 cuenta como guardada: la foto ya estaba en el reporte", async () => {
        expect(await subirFoto("r1", foto, fakeApi({ multimedia: 409 }))).toBeNull();
    });

    it("devuelve el motivo traducido si falla", async () => {
        expect(await subirFoto("r1", foto, fakeApi({ multimedia: 413 }))).toEqual({
            motivo: "la foto es demasiado grande para el servidor", reintentable: false,
        });
    });
});

describe("falloFoto", () => {
    it.each([
        [503, true],
        [500, true],
        [400, false],
        [404, false],
        [413, false],
        [422, false],
    ])("con %i, reintentable = %s", (status, reintentable) => {
        expect(falloFoto(httpError(status)).reintentable).toBe(reintentable);
    });

    it("sin código (sin conexión o tiempo agotado) se puede reintentar", () => {
        expect(falloFoto(new Error("El servidor tardó demasiado en responder."))).toEqual({
            motivo: "la foto no se pudo subir", reintentable: true,
        });
    });
});
