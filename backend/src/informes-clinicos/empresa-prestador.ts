import { DataSource } from 'typeorm';

export interface EmpresaPrestador {
  id: number;
  nombre: string;
  identificacion: string | null;
  direccion: string | null;
  telefono: string | null;
  ciudad: string | null;
  codigoPrestador: string | null;
  logo: Buffer | null;
}

/**
 * Empresa (prestador) que se usa en informes y en el RDA. El escritorio tomaba la
 * primera fila (DRDA.NombrePrestador: ORDER BY id LIMIT 1), lo que puede sacar el
 * nombre de otra empresa (riesgo §8.2 del traspaso). Aquí se prefiere la empresa cuyo
 * codigo_prestador coincide con el REPS configurado para el RDA, luego la que tenga
 * algún codigo_prestador, luego la primera activa.
 */
export async function empresaPrestador(dataSource: DataSource): Promise<EmpresaPrestador | null> {
  let reps: string | null = null;
  try {
    const [cfg] = await dataSource.query(
      'SELECT codigo_prestador_reps AS reps FROM config_interop_api ORDER BY estado DESC, id DESC LIMIT 1',
    );
    reps = cfg?.reps?.trim() || null;
  } catch {
    /* sin tabla de configuración RDA */
  }
  const [e] = await dataSource.query(
    `SELECT ID AS id, NOMBRE AS nombre, IDENTIFICACION AS identificacion, DIRECCION AS direccion,
            TELEFONO AS telefono, CIUDAD AS ciudad, codigo_prestador AS codigoPrestador, LOGO AS logo
     FROM empresa
     ORDER BY (TRIM(IFNULL(codigo_prestador,'')) = ?) DESC,
              (TRIM(IFNULL(codigo_prestador,'')) <> '') DESC,
              (ESTADO = 'A') DESC, ID ASC
     LIMIT 1`,
    [reps ?? ''],
  );
  if (!e) return null;
  const limpiar = (v: unknown) => (typeof v === 'string' ? v.trim() || null : null);
  return {
    id: e.id,
    nombre: limpiar(e.nombre) ?? '',
    identificacion: limpiar(e.identificacion),
    direccion: limpiar(e.direccion),
    telefono: limpiar(e.telefono),
    ciudad: limpiar(e.ciudad),
    codigoPrestador: limpiar(e.codigoPrestador),
    logo: Buffer.isBuffer(e.logo) && e.logo.length ? e.logo : null,
  };
}
