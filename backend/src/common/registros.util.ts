import { EntityManager } from 'typeorm';
import { Registros } from '../seguridad/entities/registros.entity';

/** Tablas que usa Funciones.GuardarRegistro() del VB.NET (columna registros.ID_TABLA). */
export const TABLA_REGISTRO = {
  PATOLOGIA: 5,
  CITOLOGIA: 6,
} as const;

export const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const horaActual = () => new Date().toTimeString().slice(0, 8);

/**
 * Equivalente a Funciones.GuardarRegistro(IdTabla, IdRegistro, IdUsuario, TipoRegistro, Nota):
 * deja la traza de quién guardó/firmó un estudio en la tabla `registros`.
 */
export async function guardarRegistro(
  manager: EntityManager,
  idTabla: number,
  idRegistro: number,
  idUsuario: number,
  tipoRegistro: string,
  nota: string,
) {
  const repo = manager.getRepository(Registros);
  await repo.save(
    repo.create({
      fecha: hoyISO(),
      hora: horaActual(),
      idTabla,
      idRegistro,
      idUsuario,
      tipoRegistro: tipoRegistro.slice(0, 50),
      nota: nota ?? '',
    }),
  );
}
