/**
 * Enums de estado compartidos.
 *
 * IMPORTANTE: los valores (a la derecha) son EXACTAMENTE los que ya existen
 * almacenados en la base de datos (columnas set('A','I') o set('A','I','E')).
 * No se modifica el dato en la BD; solo se le da un nombre legible en el
 * código (ACTIVO/INACTIVO/ELIMINADO) en lugar de manejar 'A'/'I'/'E' sueltos.
 */

export enum EstadoActivoInactivo {
  ACTIVO = 'A',
  INACTIVO = 'I',
}

export enum EstadoActivoInactivoEliminado {
  ACTIVO = 'A',
  INACTIVO = 'I',
  ELIMINADO = 'E',
}
