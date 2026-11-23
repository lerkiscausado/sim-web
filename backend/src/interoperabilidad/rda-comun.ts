/**
 * Constantes y utilidades comunes del RDA (Resolución 1888 de 2025, guía IHCE / FHIR R4).
 * Portado de RDABundleBuilder.vb y RDAConsultaExternaBuilder.vb (SIM-GLOBAL, rama gastrolap).
 */
export const LOINC = 'http://loinc.org';
export const BASE_RDA = 'https://fhir.minsalud.gov.co/rda';
export const SD = (nombre: string) => `${BASE_RDA}/StructureDefinition/${nombre}`;
export const CS = (nombre: string) => `${BASE_RDA}/CodeSystem/${nombre}`;

export type Json = Record<string, any>;

/** Datos del paciente que usan los dos documentos (tabla `usuarios`). */
export interface PacienteRda {
  idTipoIdentificacion: string;
  identificacion: string;
  primerNombre: string | null;
  segundoNombre: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
  sexo: string | null;
  fechaNacimiento: string | null; // yyyy-MM-dd
  codigoMunicipio: string | null;
  zona: string | null;
  codigoPaisNacimiento: string | null;
  codigoEtnia: string | null;
  codigoDiscapacidad: string | null;
  codigoIdentidadGenero: string | null;
}

/** Datos del especialista (tabla `especialistas`). */
export interface EspecialistaRda {
  idTipoIdentificacion: string | null;
  identificacion: string | null;
  nombre: string | null;
  primerNombre: string | null;
  segundoNombre: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
}

export interface PrestadorRda {
  codigoPrestadorReps: string;
  nitPrestador: string | null;
  nombre: string;
}

/** Id de recurso FHIR válido: letras, números, '-' y '.', máximo 64 (SanitizarId del VB). */
export function sanitizarId(valor?: string | null): string {
  if (!valor || !valor.trim()) return 'SD';
  const limpio = valor.replace(/[^A-Za-z0-9.-]/g, '');
  return limpio.slice(0, 64) || 'SD';
}

export const envolver = (recurso: Json) => ({ resource: recurso });

/**
 * Fecha y hora con zona de Colombia (UTC-05:00, sin horario de verano), sin depender de
 * la zona del servidor. El VB usaba la hora local del equipo ("zzz").
 */
export function fechaCO(d: Date): string {
  const local = new Date(d.getTime() - 5 * 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${local.getUTCFullYear()}-${p(local.getUTCMonth() + 1)}-${p(local.getUTCDate())}T${p(local.getUTCHours())}:${p(local.getUTCMinutes())}:${p(local.getUTCSeconds())}-05:00`;
}

export function fechaSoloCO(d: Date): string {
  return fechaCO(d).slice(0, 10);
}

export const vacio = (v?: string | null) => !v || !String(v).trim();

// ── Tablas código → texto (las mismas del escritorio; "display" es obligatorio) ──

const ETNIAS: Record<string, string> = {
  '1': 'Indígena',
  '2': 'ROM (Gitano)',
  '3': 'Raizal (Archipiélago San Andrés y Providencia)',
  '4': 'Palenquero de San Basilio',
  '5': 'Negro(a) o mulato(a) o afrocolombiano(a) o afrodescendiente',
  '6': 'Otras etnias',
  '99': 'Ninguna de las anteriores',
};
const DISCAPACIDADES: Record<string, string> = {
  '01': 'Discapacidad física',
  '02': 'Discapacidad visual',
  '03': 'Discapacidad auditiva',
  '04': 'Discapacidad intelectual',
  '05': 'Discapacidad sicosocial',
  '06': 'Sordoceguera',
  '07': 'Discapacidad múltiple',
  '08': 'Sin discapacidad',
};
const IDENTIDADES_GENERO: Record<string, string> = {
  '01': 'Masculino',
  '02': 'Femenino',
  '03': 'Transgénero',
  '04': 'Neutro',
  '05': 'No lo declara',
};
const PAISES: Record<string, string> = {
  '170': 'Colombia', '862': 'Venezuela', '218': 'Ecuador', '604': 'Perú', '076': 'Brasil',
  '032': 'Argentina', '152': 'Chile', '068': 'Bolivia', '600': 'Paraguay', '858': 'Uruguay',
  '591': 'Panamá', '188': 'Costa Rica', '340': 'Honduras', '222': 'El Salvador', '320': 'Guatemala',
  '558': 'Nicaragua', '192': 'Cuba', '214': 'República Dominicana', '484': 'México',
  '840': 'Estados Unidos', '124': 'Canadá', '724': 'España', '380': 'Italia', '250': 'Francia',
  '276': 'Alemania', '826': 'Reino Unido', '620': 'Portugal', '156': 'China', '356': 'India',
};
export const displayEtnia = (c: string) => ETNIAS[c.trim()] ?? c;
export const displayDiscapacidad = (c: string) => DISCAPACIDADES[c.trim()] ?? c;
export const displayIdentidadGenero = (c: string) => IDENTIDADES_GENERO[c.trim()] ?? c;
export const displayPais = (c: string) => PAISES[c.trim()] ?? 'Colombia';

/** Extensiones obligatorias de PatientRDA (nacionalidad, etnia, discapacidad) y la opcional de identidad de género. */
export function extensionesPaciente(p: PacienteRda): Json[] {
  const pais = vacio(p.codigoPaisNacimiento) ? '170' : p.codigoPaisNacimiento!.trim();
  const etnia = vacio(p.codigoEtnia) ? '99' : p.codigoEtnia!.trim();
  const disc = vacio(p.codigoDiscapacidad) ? '08' : p.codigoDiscapacidad!.trim();
  const ext: Json[] = [
    { url: SD('ExtensionPatientNationality'), valueCoding: { system: CS('ISO31661'), code: pais, display: displayPais(pais) } },
    { url: SD('ExtensionPatientEthnicity'), valueCoding: { system: CS('ColombianEthnicGroup'), code: etnia, display: displayEtnia(etnia) } },
    { url: SD('ExtensionPatientDisability'), valueCoding: { system: CS('ColombianDisabilityClassification'), code: disc, display: displayDiscapacidad(disc) } },
  ];
  if (!vacio(p.codigoIdentidadGenero)) {
    const g = p.codigoIdentidadGenero!.trim();
    ext.push({ url: SD('ExtensionPatientGenderIdentity'), valueCoding: { system: CS('ColombianGenderIdentity'), code: g, display: displayIdentidadGenero(g) } });
  }
  return ext;
}

/**
 * Recurso Patient (PatientRDA), común a los dos documentos.
 * direccionSoloConMunicipio: RDA-Consulta Externa (validado así en el sandbox) solo manda
 * la dirección si hay municipio; RDA-Paciente la manda siempre con el país.
 */
export function construirPatient(idPaciente: string, p: PacienteRda, opciones: { direccionSoloConMunicipio?: boolean } = {}): Json {
  const sexo = (p.sexo ?? '').trim().toUpperCase();
  const genero = sexo === 'M' ? 'male' : sexo === 'F' ? 'female' : 'unknown';
  const nombre: Json = {
    use: 'official',
    family: [p.primerApellido, p.segundoApellido].filter((x) => !vacio(x)).join(' '),
    given: [p.primerNombre, p.segundoNombre].filter((x) => !vacio(x)),
  };
  // EVOL valida primer y segundo apellido por separado (err-000 sin esta extensión).
  if (!vacio(p.primerApellido)) {
    const ext: Json[] = [{ url: SD('ExtensionFathersFamilyName'), valueString: p.primerApellido }];
    if (!vacio(p.segundoApellido)) ext.push({ url: SD('ExtensionMothersFamilyName'), valueString: p.segundoApellido });
    nombre._family = { extension: ext };
  }
  const direccion: Json = {
    id: 'HomeAddress-0',
    use: 'home',
    type: 'physical',
    country: 'Colombia',
    _country: { extension: [{ url: SD('ExtensionCountryCode'), valueCoding: { system: CS('ISO31661'), code: '170' } }] },
  };
  const municipio = (p.codigoMunicipio ?? '').trim();
  if (municipio) {
    direccion._city = { extension: [{ url: SD('ExtensionDivipolaMunicipality'), valueCoding: { system: CS('DIVIPOLA'), code: municipio } }] };
  }
  if (!vacio(p.zona)) {
    const rural = p.zona!.trim().toUpperCase() === 'R';
    direccion.extension = [
      { url: SD('ExtensionResidenceZone'), valueCoding: { system: CS('ColombianResidenceZone'), code: rural ? '02' : '01', display: rural ? 'Rural' : 'Urbana' } },
    ];
  }
  const tipo = (p.idTipoIdentificacion ?? '').trim().toUpperCase();
  const patient: Json = {
    resourceType: 'Patient',
    id: idPaciente,
    meta: { profile: [SD('PatientRDA')] },
    extension: extensionesPaciente(p),
    identifier: [
      {
        id: 'NationalPersonIdentifier-0',
        type: {
          coding: [
            { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PN', display: 'Person number' },
            // Sin "display": así lo aceptó MinSalud en RDA-Paciente; un texto distinto al
            // oficial provocaría un rechazo (el escritorio mandaba "Cédula ciudadanía" fijo).
            { system: CS('ColombianPersonIdentifier'), code: tipo },
          ],
        },
        use: 'official',
        system: `${BASE_RDA}/NamingSystem/RNEC`,
        value: (p.identificacion ?? '').trim(),
      },
    ],
    name: [nombre],
    active: true,
    gender: genero,
  };
  if (municipio || !opciones.direccionSoloConMunicipio) patient.address = [direccion];
  if (p.fechaNacimiento) patient.birthDate = p.fechaNacimiento.slice(0, 10);
  if (genero !== 'unknown') {
    const cod = genero === 'male' ? '01' : '02';
    patient._gender = {
      extension: [{ url: SD('ExtensionBiologicalGender'), valueCoding: { system: CS('ColombianGenderGroup'), code: cod, display: cod === '01' ? 'Hombre' : 'Mujer' } }],
    };
  }
  return patient;
}

export function construirOrganization(idOrganizacion: string, pr: PrestadorRda): Json {
  const identifier: Json[] = [];
  if (!vacio(pr.nitPrestador)) {
    identifier.push({
      use: 'official',
      type: {
        coding: [
          { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'TAX', display: 'Tax ID number' },
          { system: CS('ColombianOrganizationIdentifiers'), code: 'NIT', display: 'Número de Identificación Tributaria' },
        ],
      },
      value: pr.nitPrestador!.trim(),
    });
  }
  identifier.push({
    use: 'official',
    type: {
      coding: [
        { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PRN', display: 'Provider number' },
        { system: CS('ColombianOrganizationIdentifiers'), code: 'CodigoPrestador', display: 'Código de habilitación de prestador de servicios de salud' },
      ],
    },
    system: `${BASE_RDA}/NamingSystem/REPS`,
    value: pr.codigoPrestadorReps.trim(),
  });
  const org: Json = {
    resourceType: 'Organization',
    id: idOrganizacion,
    meta: { profile: [SD('CareDeliveryOrganizationRDA')] },
    identifier,
  };
  if (!vacio(pr.nombre)) org.name = pr.nombre;
  return org;
}

export function construirPractitioner(idPractitioner: string, e: EspecialistaRda): Json {
  const tipo = vacio(e.idTipoIdentificacion) ? 'CC' : e.idTipoIdentificacion!.trim().toUpperCase();
  let nombre: Json;
  if (!vacio(e.primerNombre) && !vacio(e.primerApellido)) {
    const ext: Json[] = [{ url: SD('ExtensionFathersFamilyName'), valueString: e.primerApellido }];
    if (!vacio(e.segundoApellido)) ext.push({ url: SD('ExtensionMothersFamilyName'), valueString: e.segundoApellido });
    nombre = {
      use: 'official',
      family: [e.primerApellido, e.segundoApellido].filter((x) => !vacio(x)).join(' '),
      _family: { extension: ext },
      given: [e.primerNombre, e.segundoNombre].filter((x) => !vacio(x)),
    };
  } else {
    // Sin nombre estructurado: mejor esfuerzo con "text" (no probado contra MinSalud).
    nombre = { use: 'official', text: e.nombre ?? '' };
  }
  return {
    resourceType: 'Practitioner',
    id: idPractitioner,
    meta: { profile: [SD('PractitionerRDA')] },
    identifier: [
      {
        id: 'NationalPersonIdentifier-0',
        use: 'official',
        type: {
          coding: [
            { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PN', display: 'Person number' },
            { system: CS('ColombianPersonIdentifier'), code: tipo },
          ],
        },
        value: (e.identificacion ?? '').trim(),
      },
    ],
    name: [nombre],
  };
}
