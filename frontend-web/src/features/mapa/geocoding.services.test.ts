import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { direccionDe } from "./geocoding.services";

// Momento (en el reloj falso) y latitud de cada petición que llega a Nominatim.
let starts: { at: number; lat: string }[];

// Un solo reloj falso para todo el archivo: la cola del módulo recuerda el inicio de la última petición, y un reloj
// nuevo por prueba lo dejaría en el futuro.
beforeAll(() => { vi.useFakeTimers() });
afterAll(() => { vi.useRealTimers() });

beforeEach(() => {
    starts = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
        starts.push({ at: Date.now(), lat: new URL(url).searchParams.get("lat")! });
        return new Response(JSON.stringify({ lat: "0", lon: "0", display_name: "Calle 1, Centro" }));
    }));
});

afterEach(() => {
    vi.unstubAllGlobals();
});

// La cola es del módulo: cada prueba deja pasar el intervalo para no heredar la espera de la anterior.
const settle = () => vi.advanceTimersByTimeAsync(1_000);

describe("cola de Nominatim", () => {
    it("envía en orden y deja al menos 1 s entre el inicio real de cada petición", async () => {
        const all = Promise.all([direccionDe(1, 0), direccionDe(2, 0), direccionDe(3, 0)]);
        await vi.advanceTimersByTimeAsync(3_000);
        await all;

        expect(starts.map((s) => s.lat)).toEqual(["1", "2", "3"]);
        for (let i = 1; i < starts.length; i++) {
            expect(starts[i].at - starts[i - 1].at).toBeGreaterThanOrEqual(1_000);
        }
        await settle();
    });

    it("una búsqueda cancelada mientras espera turno no hace fetch ni retrasa a la siguiente", async () => {
        await direccionDe(1, 0);
        const first = starts[0].at;

        const stale = new AbortController();
        const cancelled = direccionDe(2, 0, stale.signal);
        const next = direccionDe(3, 0);
        const rejected = expect(cancelled).rejects.toMatchObject({ name: "AbortError" });
        await vi.advanceTimersByTimeAsync(200);
        stale.abort();
        await rejected;
        await vi.advanceTimersByTimeAsync(1_000);
        await next;

        expect(starts.map((s) => s.lat)).toEqual(["1", "3"]);
        // Sale 1 s después de la anterior real, no 2 s: la cancelada no ocupó turno.
        expect(starts[1].at - first).toBe(1_000);
        await settle();
    });

    it("ya cancelada antes de pedir no espera ni hace fetch", async () => {
        await expect(direccionDe(4, 0, AbortSignal.abort())).rejects.toMatchObject({ name: "AbortError" });
        expect(starts).toHaveLength(0);
    });
});
