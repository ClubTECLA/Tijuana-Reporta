import { afterEach, describe, expect, it, vi } from "vitest";
import { solicitarRecuperacion, verificarRecuperacion } from "./recovery.service";

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("recovery service", () => {
    it("solicita un PIN sin autenticación y acepta la respuesta 202 vacía", async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
        vi.stubGlobal("fetch", fetchMock);

        await expect(solicitarRecuperacion({ email: "persona@example.com" })).resolves.toBeUndefined();

        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toContain("/auth/recovery");
        expect(init.method).toBe("POST");
        expect(JSON.parse(String(init.body))).toEqual({ email: "persona@example.com" });
        expect(new Headers(init.headers).has("Authorization")).toBe(false);
    });

    it("verifica el PIN y guarda la contraseña usando el endpoint sin autenticación", async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
        vi.stubGlobal("fetch", fetchMock);

        await expect(verificarRecuperacion({
            email: "persona@example.com",
            pin: "123456",
            new_password: "NuevaClave123!",
        })).resolves.toBeUndefined();

        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toContain("/auth/recovery/verify");
        expect(init.method).toBe("POST");
        expect(JSON.parse(String(init.body))).toEqual({
            email: "persona@example.com",
            pin: "123456",
            new_password: "NuevaClave123!",
        });
        expect(new Headers(init.headers).has("Authorization")).toBe(false);
    });
});
