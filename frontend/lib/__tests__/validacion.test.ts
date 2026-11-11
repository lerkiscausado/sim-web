import { describe, expect, it } from "vitest";
import { reglas, validar } from "../validacion";

describe("reglas", () => {
    it("requerido trata vacíos, espacios y HTML vacío del editor como faltantes", () => {
        const r = reglas.requerido("falta");
        expect(r("")).toBe("falta");
        expect(r("   ")).toBe("falta");
        expect(r(undefined)).toBe("falta");
        expect(r("<p><br></p>")).toBe("falta");
        expect(r("<p>&nbsp;</p>")).toBe("falta");
        expect(r("<p>texto</p>")).toBeNull();
        expect(r(0)).toBeNull();
    });

    it("longitudes", () => {
        expect(reglas.maxLong(3)("abcd")).toMatch(/Máximo 3/);
        expect(reglas.maxLong(3)("abc")).toBeNull();
        expect(reglas.minLong(3)("ab")).toMatch(/al menos 3/);
        expect(reglas.minLong(3)("")).toBeNull(); // vacío lo decide `requerido`
    });

    it("correo y lista de correos", () => {
        expect(reglas.email()("a@b.co")).toBeNull();
        expect(reglas.email()("a@b")).not.toBeNull();
        expect(reglas.emails()("a@b.co; c@d.com, e@f.org")).toBeNull();
        expect(reglas.emails()("a@b.co; malo")).not.toBeNull();
    });

    it("número con rango y entero", () => {
        const r = reglas.numero({ min: 0, max: 10, entero: true });
        expect(r("5")).toBeNull();
        expect(r("5,5")).toMatch(/entero/);
        expect(r(-1)).toMatch(/mayor o igual/);
        expect(r("abc")).toMatch(/número/);
        expect(r("")).toBeNull();
    });

    it("teléfono", () => {
        expect(reglas.telefono()("315 571 5854")).toBeNull();
        expect(reglas.telefono()("+57 3155715854")).toBeNull();
        expect(reglas.telefono()("123")).not.toBeNull();
    });

    it("fechaNoFutura y fechaDesde", () => {
        expect(reglas.fechaNoFutura()("2999-01-01")).not.toBeNull();
        expect(reglas.fechaNoFutura()("2000-01-01")).toBeNull();
        const desde = reglas.fechaDesde<{ ini: string }>("ini", "el inicio");
        expect(desde("2026-01-01", { ini: "2026-02-01" })).toMatch(/posterior/);
        expect(desde("2026-03-01", { ini: "2026-02-01" })).toBeNull();
    });

    it("si: aplica la regla solo cuando se cumple la condición", () => {
        const r = reglas.si<{ firmar: boolean }>((f) => f.firmar, reglas.requerido("obligatorio para firmar"));
        expect(r("", { firmar: false })).toBeNull();
        expect(r("", { firmar: true })).toBe("obligatorio para firmar");
    });
});

describe("validar", () => {
    it("devuelve el primer error de cada campo", () => {
        const form = { nombre: "", correo: "malo", edad: "200" };
        const errores = validar(form, {
            nombre: [reglas.requerido("nombre obligatorio"), reglas.minLong(3)],
            correo: [reglas.email("correo inválido")],
            edad: [reglas.numero({ max: 120, mensaje: "edad inválida" })],
        });
        expect(errores).toEqual({ nombre: "nombre obligatorio", correo: "correo inválido", edad: "edad inválida" });
    });

    it("sin errores devuelve objeto vacío", () => {
        expect(validar({ a: "x" }, { a: [reglas.requerido()] })).toEqual({});
    });
});
