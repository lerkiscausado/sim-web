import { afterEach, describe, expect, it, vi } from "vitest";
import { aISOLocal, calcularEdad, deISOLocal, hoyISO, sumarDiasHabiles } from "../fechas";

afterEach(() => vi.useRealTimers());

describe("hoyISO", () => {
    it("usa la fecha local, no UTC (Colombia a las 11 p. m. sigue siendo el mismo día)", () => {
        vi.useFakeTimers();
        // 10 de noviembre a las 23:30 hora local
        vi.setSystemTime(new Date(2026, 10, 10, 23, 30));
        expect(hoyISO()).toBe("2026-11-10");
    });
});

describe("deISOLocal", () => {
    it("interpreta YYYY-MM-DD como medianoche local", () => {
        const d = deISOLocal("2026-03-05")!;
        expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 2, 5, 0]);
    });
    it("acepta fecha con hora", () => {
        expect(aISOLocal(deISOLocal("2026-03-05T10:20:00")!)).toBe("2026-03-05");
    });
    it("rechaza fechas imposibles o mal formadas", () => {
        expect(deISOLocal("2026-02-31")).toBeNull();
        expect(deISOLocal("05/03/2026")).toBeNull();
        expect(deISOLocal("")).toBeNull();
    });
});

describe("sumarDiasHabiles", () => {
    it("salta sábados y domingos", () => {
        // viernes 6 de nov de 2026 + 1 día hábil = lunes 9
        expect(sumarDiasHabiles("2026-11-06", 1)).toBe("2026-11-09");
        // martes 10 + 7 hábiles = jueves 19
        expect(sumarDiasHabiles("2026-11-10", 7)).toBe("2026-11-19");
    });
    it("devuelve vacío con fecha inválida", () => {
        expect(sumarDiasHabiles("x", 3)).toBe("");
    });
});

describe("calcularEdad", () => {
    const hoy = new Date(2026, 10, 10);
    it("cuenta años cumplidos", () => {
        expect(calcularEdad("1990-11-10", hoy)).toBe(36);
        expect(calcularEdad("1990-11-11", hoy)).toBe(35);
    });
    it("no da negativos ni falla con fechas inválidas", () => {
        expect(calcularEdad("2030-01-01", hoy)).toBe(0);
        expect(calcularEdad("", hoy)).toBe(0);
    });
});
