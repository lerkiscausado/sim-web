import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "SANDRA HERRERA LOMONACO" → "Sandra Herrera Lomonaco" (para saludos y nombres de usuario). */
export function nombrePropio(texto: string | null | undefined): string {
    return (texto ?? "")
        .toLocaleLowerCase("es-CO")
        .replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, letra: string) => sep + letra.toLocaleUpperCase("es-CO"));
}
