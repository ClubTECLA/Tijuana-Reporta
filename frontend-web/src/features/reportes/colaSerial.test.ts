import { describe, expect, it } from "vitest";
import { crearColaSerial } from "./colaSerial";

// Promesa que se resuelve o rechaza a mano, para decidir el orden de las respuestas.
function diferida<T>() {
    let resolver!: (valor: T) => void;
    let rechazar!: (error: unknown) => void;
    const promesa = new Promise<T>((res, rej) => { resolver = res; rechazar = rej });
    return { promesa, resolver, rechazar };
}

describe("crearColaSerial", () => {
    it("aplica las respuestas en el orden de los cambios aunque el servidor tarde distinto", async () => {
        const enCola = crearColaSerial();
        let reporte = { es_historico: false, estado: "Pendiente" };
        const estado = diferida<typeof reporte>();
        const historico = diferida<typeof reporte>();
        let historicoEmpezado = false;

        // Primero el cambio de estado (lento) y después pasar a histórico.
        const a = enCola(async () => { reporte = await estado.promesa });
        const b = enCola(async () => { historicoEmpezado = true; reporte = await historico.promesa });

        await Promise.resolve();
        expect(historicoEmpezado).toBe(false); // espera a que termine el cambio de estado

        estado.resolver({ es_historico: false, estado: "Probable" });
        await a;
        historico.resolver({ es_historico: true, estado: "Probable" });
        await b;

        expect(reporte).toEqual({ es_historico: true, estado: "Probable" });
    });

    it("un comentario publicado durante otro cambio no se pierde", async () => {
        const enCola = crearColaSerial();
        type Reporte = { es_historico: boolean; comentarios: string[] };
        let reporte: Reporte = { es_historico: false, comentarios: [] };
        const historico = diferida<Reporte>();

        // Pasar a histórico (respuesta lenta, sin el comentario) y, mientras, publicar un comentario.
        const a = enCola(async () => { reporte = await historico.promesa });
        const b = enCola(async () => { reporte = { ...reporte, comentarios: [...reporte.comentarios, "nuevo"] } });

        historico.resolver({ es_historico: true, comentarios: [] });
        await Promise.all([a, b]);

        expect(reporte).toEqual({ es_historico: true, comentarios: ["nuevo"] });
    });

    it("un fallo llega a quien lo pidió y no detiene la cola", async () => {
        const enCola = crearColaSerial();
        const orden: string[] = [];

        const fallida = enCola(async () => { orden.push("1"); throw new Error("409") });
        const siguiente = enCola(async () => { orden.push("2"); return "ok" });

        await expect(fallida).rejects.toThrow("409");
        await expect(siguiente).resolves.toBe("ok");
        expect(orden).toEqual(["1", "2"]);
    });
});
