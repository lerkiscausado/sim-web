import { describe, expect, it } from "vitest";
import { paginasVisibles } from "../pagination-controls";

describe("paginasVisibles", () => {
    it("muestra todas las páginas cuando son pocas", () => {
        expect(paginasVisibles(1, 5)).toEqual([1, 2, 3, 4, 5]);
    });
    it("al inicio muestra las primeras y la última", () => {
        expect(paginasVisibles(1, 20)).toEqual([1, 2, 3, 4, "…", 20]);
    });
    it("en medio muestra vecinas con saltos a ambos lados", () => {
        expect(paginasVisibles(10, 20)).toEqual([1, "…", 9, 10, 11, "…", 20]);
    });
    it("al final muestra las últimas y la primera", () => {
        expect(paginasVisibles(20, 20)).toEqual([1, "…", 17, 18, 19, 20]);
    });
});
