import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, apiUrl, onSessionExpired, sessionToken } from "./http";

// localStorage en memoria: el cliente guarda ahí el token.
function memoryStorage(): Storage {
    const data = new Map<string, string>();
    return {
        getItem: (key) => data.get(key) ?? null,
        setItem: (key, value) => { data.set(key, String(value)) },
        removeItem: (key) => { data.delete(key) },
        clear: () => data.clear(),
        key: (index) => [...data.keys()][index] ?? null,
        get length() { return data.size },
    };
}

const jsonResponse = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
    vi.stubGlobal("localStorage", memoryStorage());
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("apiRequest", () => {
    it("pone la URL base, el token, la query y el cuerpo JSON", async () => {
        sessionToken.set("t1");
        fetchMock.mockResolvedValue(jsonResponse(201, { id: "r1" }));

        const result = await apiRequest("/reportes", {
            method: "POST",
            json: { incidente_id: 1 },
            query: { min_lat: 32.5, omitido: undefined, estado: ["Pendiente", "Verificado"] },
        });

        expect(result).toEqual({ id: "r1" });
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe(`${apiUrl}/reportes?min_lat=32.5&estado=Pendiente&estado=Verificado`);
        const headers = new Headers(init.headers);
        expect(headers.get("Authorization")).toBe("Bearer t1");
        expect(headers.get("Content-Type")).toBe("application/json");
        expect(init.body).toBe('{"incidente_id":1}');
    });

    it("sin sesión no hace la petición", async () => {
        await expect(apiRequest("/reportes")).rejects.toThrow("Se requiere iniciar sesión.");
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("un 401 con token cierra la sesión y avisa una sola vez aunque fallen varias peticiones", async () => {
        sessionToken.set("t1");
        fetchMock.mockImplementation(async () => jsonResponse(401, { message: "Token inválido" }));
        const listener = vi.fn();
        const unsubscribe = onSessionExpired(listener);

        const results = await Promise.allSettled([apiRequest("/reportes"), apiRequest("/incidentes")]);

        unsubscribe();
        expect(listener).toHaveBeenCalledTimes(1);
        expect(sessionToken.get()).toBeNull();
        for (const result of results) {
            expect(result).toMatchObject({ status: "rejected", reason: { message: "Token inválido", status: 401 } });
        }
    });

    it("el 401 del login son credenciales incorrectas: no cierra la sesión ni envía el token", async () => {
        sessionToken.set("t-anterior");
        fetchMock.mockResolvedValue(jsonResponse(401, { message: "Credenciales inválidas" }));
        const listener = vi.fn();
        const unsubscribe = onSessionExpired(listener);

        await expect(apiRequest("/auth/login", { method: "POST", json: {}, auth: false }))
            .rejects.toMatchObject({ message: "Credenciales inválidas", status: 401 });

        unsubscribe();
        expect(listener).not.toHaveBeenCalled();
        expect(sessionToken.get()).toBe("t-anterior");
        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(new Headers(init.headers).has("Authorization")).toBe(false);
    });

    it("traduce los fallos de red, el tiempo límite y las respuestas inválidas", async () => {
        sessionToken.set("t1");

        fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
        await expect(apiRequest("/reportes")).rejects.toThrow("No hay conexión con el servidor.");

        fetchMock.mockRejectedValueOnce(new DOMException("timeout", "TimeoutError"));
        await expect(apiRequest("/reportes")).rejects.toThrow("El servidor tardó demasiado en responder.");

        fetchMock.mockResolvedValueOnce(new Response("no es json", { status: 200 }));
        await expect(apiRequest("/reportes")).rejects.toThrow("El servidor envió una respuesta inválida.");
    });

    it("deja pasar la cancelación de quien llama y devuelve undefined con 204", async () => {
        sessionToken.set("t1");

        fetchMock.mockRejectedValueOnce(new DOMException("cancelada", "AbortError"));
        await expect(apiRequest("/reportes")).rejects.toMatchObject({ name: "AbortError" });

        fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
        await expect(apiRequest("/auth/logout", { method: "POST", auth: false })).resolves.toBeUndefined();
    });
});
