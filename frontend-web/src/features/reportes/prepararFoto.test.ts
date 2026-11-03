import { describe, expect, it } from "vitest";
import { prepararFoto } from "./prepararFoto";

// En Node no hay createImageBitmap: solo se prueba qué archivos se aceptan y qué mensaje recibe cada uno.
// La reducción a JPEG se probó en el navegador (3000×2000 → 1920×1280).
describe("prepararFoto", () => {
    it("rechaza formatos que no son imagen", async () => {
        await expect(prepararFoto(new File(["x"], "nota.txt", { type: "text/plain" })))
            .rejects.toThrow("Formato no soportado. Usa una foto JPG, PNG, WebP o HEIC.");
    });

    it("acepta HEIC aunque el navegador no conozca su tipo, y explica si no puede abrirlo", async () => {
        await expect(prepararFoto(new File(["x"], "IMG_0001.HEIC", { type: "" })))
            .rejects.toThrow("Este navegador no puede abrir fotos HEIC. Expórtala como JPG y vuelve a elegirla.");
    });

    it("rechaza archivos de más de 20 MB sin intentar abrirlos", async () => {
        const big = new File([new Uint8Array(20 * 1024 * 1024 + 1)], "grande.jpg", { type: "image/jpeg" });
        await expect(prepararFoto(big)).rejects.toThrow("La foto pesa más de 20 MB.");
    });
});
