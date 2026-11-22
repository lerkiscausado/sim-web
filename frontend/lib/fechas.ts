/**
 * Utilidades de fecha en HORA LOCAL.
 *
 * Importante: `new Date().toISOString()` devuelve la fecha en UTC; en Colombia (UTC-5)
 * a partir de las 7:00 p. m. eso ya es "mañana". Por eso todas las fechas por defecto
 * de los formularios deben salir de `hoyISO()`.
 */

const dos = (n: number) => String(n).padStart(2, "0");

/** Fecha local como "YYYY-MM-DD". */
export function aISOLocal(d: Date): string {
    return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

/** Hoy, en hora local, como "YYYY-MM-DD". */
export function hoyISO(): string {
    return aISOLocal(new Date());
}

/**
 * Convierte "YYYY-MM-DD" (o "YYYY-MM-DDTHH:mm…") en una fecha local a medianoche.
 * `new Date("2026-11-10")` se interpreta en UTC y en Colombia da el día anterior.
 */
export function deISOLocal(fechaISO: string): Date | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fechaISO ?? "");
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    // Rechaza fechas imposibles (p. ej. 2026-02-31 que JS convertiría en marzo).
    return d.getMonth() === Number(m[2]) - 1 ? d : null;
}

/** Suma N días hábiles (lunes a viernes) a una fecha "YYYY-MM-DD". */
export function sumarDiasHabiles(fechaISO: string, dias: number): string {
    const fecha = deISOLocal(fechaISO);
    if (!fecha) return "";
    let agregados = 0;
    while (agregados < dias) {
        fecha.setDate(fecha.getDate() + 1);
        const diaSemana = fecha.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) agregados++;
    }
    return aISOLocal(fecha);
}

/** Edad cumplida en años a la fecha `hoy` (por defecto, hoy). */
export function calcularEdad(fechaNacimientoISO: string, hoy: Date = new Date()): number {
    const nacimiento = deISOLocal(fechaNacimientoISO);
    if (!nacimiento) return 0;
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return Math.max(0, edad);
}

/**
 * Días hábiles (lunes a viernes) transcurridos desde `fechaISO` hasta `hoy`, sin contar
 * el día de ingreso. Ingreso el viernes y hoy lunes = 1. Fechas futuras o inválidas = 0.
 */
export function diasHabilesDesde(fechaISO: string, hoy: Date = new Date()): number {
    const desde = deISOLocal(fechaISO);
    if (!desde) return 0;
    const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    let dias = 0;
    const d = new Date(desde);
    while (d < hasta) {
        d.setDate(d.getDate() + 1);
        const dia = d.getDay();
        if (dia !== 0 && dia !== 6) dias++;
    }
    return dias;
}

/** Plazo de respuesta, en días hábiles, a partir del cual un estudio sin firmar se marca como vencido. */
export const PLAZO_DIAS_HABILES = 5;
