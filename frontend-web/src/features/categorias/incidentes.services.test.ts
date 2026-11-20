import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiUrl } from "@/lib/http";
import { actualizarIncidente, eliminarIncidente } from "./incidentes.services";
import type { ApiActualizarIncidenteRequest } from "@/types/api-types";

const fetchMock = vi.fn();

beforeEach(() => {
    vi.stubGlobal("localStorage", { getItem: () => "token" });
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("eliminarIncidente", () => {
    it("envía DELETE al endpoint del incidente y acepta respuesta sin contenido", async () => {
        await expect(eliminarIncidente(42)).resolves.toBeUndefined();

        expect(fetchMock).toHaveBeenCalledOnce();
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe(`${apiUrl}/incidentes/42`);
        expect(init.method).toBe("DELETE");
    });
});

describe("actualizarIncidente", () => {
    it("envía PUT al endpoint del incidente con todos los campos requeridos", async () => {
        const body: ApiActualizarIncidenteRequest = {
            nombre: "Bache",
            etiqueta: "Bache",
            tiempo_limite: 60,
            radio: 100,
            color: "#066ed6",
            esta_activo: true,
        };
        fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 42, ...body, tags: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        }));

        await actualizarIncidente(42, body);

        expect(fetchMock).toHaveBeenCalledOnce();
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe(`${apiUrl}/incidentes/42`);
        expect(init.method).toBe("PUT");
        expect(init.body).toBe(JSON.stringify(body));
    });
});
