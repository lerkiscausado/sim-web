import { promises as fs } from 'fs';
import * as path from 'path';
import { carpetaAlmacenamiento } from '../consulta-ordenes/archivos-orden.service';

/** Nombre del archivo de una RUTA guardada por la web ("123-abc.jpg") o por el escritorio ("c:\\estudios\\51502\\558754.jpg"). */
export function nombreArchivoImagen(ruta: string) {
  return path.win32.basename((ruta ?? '').trim());
}

/** Lee el archivo de una foto; null si no está en el servidor (p. ej. fotos históricas que siguen en el equipo de captura). */
export async function leerArchivoImagen(ruta: string): Promise<Buffer | null> {
  const nombre = nombreArchivoImagen(ruta);
  if (!nombre) return null;
  try {
    return await fs.readFile(carpetaAlmacenamiento('imagenes', nombre));
  } catch {
    return null;
  }
}
