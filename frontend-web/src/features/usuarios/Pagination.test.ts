import { describe, expect, it } from "vitest";
import { getPaginationItems } from "./paginationUtils";

describe("getPaginationItems", () => {
  it("muestra menos páginas antes del ellipsis al inicio", () => {
    expect(getPaginationItems(1, 2303)).toEqual([1, 2, "ellipsis", 2303]);
    expect(getPaginationItems(2, 2303)).toEqual([1, 2, "ellipsis", 2303]);
  });

  it("muestra páginas alrededor de la página activa", () => {
    expect(getPaginationItems(5, 10)).toEqual([1, "ellipsis", 5, "ellipsis", 10]);
  });

  it("muestra las páginas finales al acercarse al final", () => {
    expect(getPaginationItems(10, 10)).toEqual([1, "ellipsis", 9, 10]);
  });

  it("muestra todas las páginas cuando son tres o menos", () => {
    expect(getPaginationItems(2, 3)).toEqual([1, 2, 3]);
  });

  it("mantiene como máximo tres páginas numéricas visibles", () => {
    expect(getPaginationItems(3, 5)).toEqual([1, "ellipsis", 3, "ellipsis", 5]);
    expect(getPaginationItems(2, 4)).toEqual([1, 2, "ellipsis", 4]);
  });

  it("mantiene al menos una página cuando el total es cero", () => {
    expect(getPaginationItems(1, 0)).toEqual([1]);
  });

  it("limita la página activa al rango disponible", () => {
    expect(getPaginationItems(20, 8)).toEqual([1, "ellipsis", 7, 8]);
  });
});
