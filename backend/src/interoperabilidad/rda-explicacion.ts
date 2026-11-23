/**
 * Traduce la respuesta de MinSalud (o el error interno) a lenguaje claro, con qué hacer.
 * Port de frmHistorialRDA.MotivoRechazo / ExplicarResultado.
 */
export function nombreDocumento(tipo: string): string {
  switch ((tipo ?? '').trim().toUpperCase()) {
    case 'RDA-PACIENTE':
      return 'Antecedentes del paciente';
    case 'RDA-CONSULTA-EXTERNA':
      return 'Resumen de la atención';
    case 'RDA-PACIENTE-MPI':
      return 'Consulta previa al MPI (aviso)';
    default:
      return tipo;
  }
}

export function primerErrorMinSalud(detalle?: string | null): string | null {
  if (!detalle || !detalle.trimStart().startsWith('{')) return null;
  try {
    const raiz = JSON.parse(detalle);
    const issues: any[] = [];
    const buscar = (n: any) => {
      if (Array.isArray(n)) n.forEach(buscar);
      else if (n && typeof n === 'object') {
        if (Array.isArray(n.issue)) issues.push(...n.issue);
        Object.values(n).forEach(buscar);
      }
    };
    buscar(raiz);
    for (const i of issues) {
      if (i?.severity === 'error' || i?.severity === 'fatal') {
        const t = i?.details?.text ?? i?.diagnostics;
        if (t && String(t).trim()) return String(t);
      }
    }
  } catch {
    /* no es JSON */
  }
  return null;
}

function motivoRechazo(codigoHttp: number | null, detalle: string): { resultado: string; queHacer: string } {
  const dl = (detalle ?? '').toLowerCase();
  if (dl.includes('envío bloqueado')) {
    return { resultado: 'El envío se bloqueó porque la configuración no apunta al sandbox de MinSalud.', queHacer: 'Revise Interoperabilidad: la web solo envía al ambiente de pruebas.' };
  }
  if (dl.includes('sin configuración de interoperabilidad')) {
    return { resultado: 'Falta configurar la conexión con MinSalud.', queHacer: 'Pida al administrador que complete la configuración RDA (credenciales y datos del prestador).' };
  }
  if (dl.startsWith('no fue posible obtener un token') || dl.includes('error de autenticación') || dl.includes('faltan credenciales')) {
    return { resultado: 'No se pudo iniciar sesión en MinSalud (credenciales vencidas o incorrectas).', queHacer: 'Verifique la configuración RDA con "Probar conexión" y luego reenvíe.' };
  }
  if (dl.startsWith('no se encontró el paciente')) {
    return { resultado: 'No se encontraron los datos del paciente de esta orden.', queHacer: 'Revise que la orden tenga un paciente registrado y reenvíe.' };
  }
  if (dl.startsWith('no se encontró el especialista') || dl.includes('profesional de salud con identificación')) {
    return { resultado: 'Faltan los datos del médico que atendió.', queHacer: 'En Talento humano > Empleados > Datos RDA complete documento y nombres del especialista, y reenvíe.' };
  }
  if (dl.startsWith('no se encontró detalle_orden') || dl.includes('sin diagnóstico')) {
    return { resultado: 'La orden no tiene el servicio o el diagnóstico registrado.', queHacer: 'Revise la orden y el diagnóstico CIE-10 de la atención, y reenvíe.' };
  }
  if (dl.includes('código de habilitación')) {
    return { resultado: 'Falta el código de habilitación (REPS) del prestador.', queHacer: 'Complételo en Configuración > Interoperabilidad y reenvíe.' };
  }
  if (dl.startsWith('excepción') || dl.includes('fetch failed') || dl.includes('timeout')) {
    return { resultado: 'No hubo comunicación con MinSalud (internet o servicio no disponible).', queHacer: 'Revise la conexión a internet y reenvíe más tarde.' };
  }
  const codigo = codigoHttp ?? 0;
  if (codigo === 401 || codigo === 403) {
    return { resultado: 'MinSalud no aceptó las credenciales del prestador.', queHacer: 'Verifique la configuración RDA con "Probar conexión" y luego reenvíe.' };
  }
  if (codigo >= 500) return { resultado: 'El servicio de MinSalud tuvo una falla temporal.', queHacer: 'Espere unos minutos y reenvíe.' };

  const textoError = primerErrorMinSalud(detalle);
  const te = (textoError ?? '').toLowerCase();
  if (te.includes('incorrect display')) {
    return { resultado: 'La descripción del diagnóstico o del procedimiento no coincide con la oficial de MinSalud.', queHacer: 'Reenvíe: el SIM corrige la descripción automáticamente. Si persiste, avise a soporte.' };
  }
  if (te.includes('value set') || te.includes('unknown code') || te.includes('not found in')) {
    return { resultado: 'MinSalud no reconoce uno de los códigos usados (diagnóstico CIE-10 o servicio CUPS).', queHacer: 'Verifique el código del diagnóstico o del procedimiento. Si es correcto, avise a soporte (los CUPS de endoscopia no están en el sandbox).' };
  }
  if (te.includes('instance count') || te.includes('minimum required')) {
    return { resultado: 'Falta un dato obligatorio en la historia o en los datos del paciente / médico.', queHacer: 'Revise que el paciente y el médico tengan documento, nombres y apellidos completos, y reenvíe.' };
  }
  if (te.includes('fixed value') || te.includes('not exactly equal')) {
    return { resultado: 'Un dato del documento no tiene el valor que exige MinSalud.', queHacer: 'Avise a soporte con la respuesta técnica.' };
  }
  if (textoError) return { resultado: `MinSalud rechazó el documento: ${textoError.length > 160 ? textoError.slice(0, 160) + '…' : textoError}`, queHacer: 'Avise a soporte con la respuesta técnica.' };
  if (codigo > 0) return { resultado: `MinSalud rechazó el documento (código ${codigo}).`, queHacer: 'Avise a soporte con la respuesta técnica.' };
  return { resultado: 'El envío no se completó.', queHacer: 'Reenvíe. Si persiste, avise a soporte con la respuesta técnica.' };
}

export function explicarResultado(exitoso: boolean, corregido: boolean, codigoHttp: number | null, detalle: string) {
  if (exitoso) return { resultado: 'MinSalud recibió el documento correctamente.', queHacer: 'No requiere ninguna acción.' };
  const m = motivoRechazo(codigoHttp, detalle);
  if (corregido) {
    return {
      resultado: `Este intento falló, pero el documento se reenvió después y MinSalud lo aceptó. Motivo del primer intento: ${m.resultado}`,
      queHacer: 'No requiere ninguna acción: el error ya quedó resuelto.',
    };
  }
  return m;
}
