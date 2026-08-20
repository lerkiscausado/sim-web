import { ValueTransformer } from 'typeorm';

/**
 * TypeORM representa las columnas MySQL `SET` como arreglo de valores
 * seleccionados (ej. ['ATENDIDO']), no como string plano — aunque en JS un
 * arreglo de un solo elemento "se comporta" como el string al compararlo
 * como clave de objeto o al renderizarlo, una comparación estricta (===)
 * contra un string literal falla silenciosamente (sin error, solo da false).
 *
 * Este transformer normaliza SIEMPRE a string plano al leer, y deja pasar
 * tal cual al escribir (TypeORM ya sabe convertir un string a la sintaxis
 * SET correcta al guardar).
 */
export const setColumnTransformer: ValueTransformer = {
  to: (value: unknown) => value,
  from: (value: unknown) => (Array.isArray(value) ? value[0] : value),
};
