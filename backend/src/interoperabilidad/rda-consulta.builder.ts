import {
  CS, EspecialistaRda, Json, LOINC, PacienteRda, PrestadorRda, SD, construirOrganization, construirPatient,
  construirPractitioner, envolver, fechaCO, fechaSoloCO, sanitizarId, vacio,
} from './rda-comun';

export interface DatosConsultaRda {
  paciente: PacienteRda;
  especialista: EspecialistaRda;
  prestador: PrestadorRda;
  diagnosticoCodigo: string;
  diagnosticoTexto: string;
  cupsConsultaCodigo: string;
  cupsConsultaTexto: string;
  /** Servicio habilitado REPS (CodeSystem REPShealthcareServices). */
  repsServicioCodigo: string;
  repsServicioTexto: string;
  /** Solo si es procedimiento: va en ServiceRequest.code (nunca en Encounter.serviceType, error 6007). */
  cupsProcedimientoCodigo?: string | null;
  cupsProcedimientoTexto?: string | null;
  /** Hora real de la atención. El escritorio usaba "ahora − 30 min → ahora". */
  inicio?: Date | null;
  fin?: Date | null;
  /** PDF de la atención (base64) para el DocumentReference (obligatorio, no admite sección vacía). */
  pdfBase64: string;
  ahora?: Date;
}

/**
 * Bundle "document" del RDA-Consulta Externa (CompositionAmbulatoryRDA, LOINC 51845-6).
 * Port de RDAConsultaExternaBuilder.vb, con las reglas validadas en el sandbox:
 * 9 secciones exactas; GrupoServicios siempre 01 (error 1008); el procedimiento como
 * ServiceRequest en "Órdenes"; ids fijos AttenderPhysician / MainDiagnosis;
 * "Documentos de soporte" siempre con un PDF real.
 */
export function construirBundleConsultaExterna(d: DatosConsultaRda): Json {
  if (!d.paciente) throw new Error('No se encontró información del paciente para armar el RDA de Consulta Externa.');
  if (!d.especialista || vacio(d.especialista.identificacion)) {
    throw new Error('RDA-Consulta Externa requiere un profesional de salud con identificación (Talento humano > Empleados > Datos RDA).');
  }
  if (vacio(d.prestador.codigoPrestadorReps)) {
    throw new Error("Falta configurar el 'Código de habilitación del prestador (REPS)' en Interoperabilidad RDA.");
  }

  const ahora = d.ahora ?? new Date();
  let fin = d.fin ?? ahora;
  let inicio = d.inicio ?? new Date(fin.getTime() - 30 * 60000);
  // MinSalud rechaza fechas futuras: se recorta a "ahora".
  if (fin > ahora) fin = ahora;
  if (inicio > fin) inicio = new Date(fin.getTime() - 30 * 60000);

  const idPaciente = sanitizarId(`${d.paciente.idTipoIdentificacion}-${d.paciente.identificacion}`);
  const idOrganizacion = sanitizarId(d.prestador.codigoPrestadorReps);
  const tipoIdEsp = vacio(d.especialista.idTipoIdentificacion) ? 'CC' : d.especialista.idTipoIdentificacion!.trim().toUpperCase();
  const idPractitioner = sanitizarId(`${tipoIdEsp}-${d.especialista.identificacion}`);
  const idEncounter = 'Encounter-0';
  const idCondition = 'Condition-0';
  const idServiceRequest = 'ServiceRequest-0';
  const idDocumentReference = 'DocumentReference-0';
  const idLocation = `${idOrganizacion}-01`; // única sede conocida (traspaso §1.3)

  const condition: Json = {
    resourceType: 'Condition',
    id: idCondition,
    meta: { profile: [SD('ConditionRDA')] },
    clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active', display: 'Active' }] },
    verificationStatus: { coding: [{ code: 'confirmed', display: 'Confirmed' }] },
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'encounter-diagnosis', display: 'Encounter Diagnosis' }] }],
    code: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: d.diagnosticoCodigo, display: d.diagnosticoTexto }] },
    subject: { reference: `#${idPaciente}` },
  };

  const hayProcedimiento = !vacio(d.cupsProcedimientoCodigo);
  const serviceRequest: Json | null = hayProcedimiento
    ? {
        resourceType: 'ServiceRequest',
        id: idServiceRequest,
        meta: { profile: [SD('ServiceRequestRDA')] },
        status: 'active',
        intent: 'order',
        category: [{ coding: [{ system: CS('ColombianHealthTechnologyCategory'), code: '01', display: 'Procedimiento en salud' }] }],
        code: { coding: [{ system: CS('CUPS'), code: d.cupsProcedimientoCodigo, display: d.cupsProcedimientoTexto }] },
        subject: { reference: `#${idPaciente}` },
        encounter: { reference: `#${idEncounter}` },
        authoredOn: fechaSoloCO(inicio),
        requester: { reference: `#${idPractitioner}` },
        reasonCode: [{ coding: [{ system: CS('RIPSFinalidadConsultaVersion2'), code: '15', display: 'DIAGNOSTICO' }] }],
      }
    : null;

  const encounter: Json = {
    resourceType: 'Encounter',
    id: idEncounter,
    meta: { profile: [SD('EncounterAmbulatoryRDA')] },
    identifier: [{ id: 'EncounterIdentifier', use: 'usual', system: `${BASE_ENCOUNTERS}`, value: `${idOrganizacion}-${fechaCO(ahora).slice(0, 19).replace(/\D/g, '')}` }],
    status: 'finished',
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
    type: [
      { coding: [{ system: CS('ColombianTechModality'), code: '01', display: 'Intramural' }] },
      { coding: [{ system: CS('GrupoServicios'), code: '01', display: 'Consulta externa' }] },
      { coding: [{ system: CS('REPShealthcareServices'), code: d.repsServicioCodigo, display: d.repsServicioTexto }] },
      { coding: [{ system: CS('EntornoAtencion'), code: '05', display: 'Institucional' }] },
    ],
    serviceType: { coding: [{ system: CS('CUPS'), code: d.cupsConsultaCodigo, display: d.cupsConsultaTexto }] },
    subject: { reference: `#${idPaciente}` },
    participant: [
      {
        id: 'AttenderPhysician',
        type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType', code: 'ATND', display: 'attender' }] }],
        individual: { reference: `#${idPractitioner}` },
      },
    ],
    period: { start: fechaCO(inicio), end: fechaCO(fin) },
    reasonCode: [{ coding: [{ system: CS('RIPSCausaExternaVersion2'), code: '38', display: 'ENFERMEDAD GENERAL' }] }],
    diagnosis: [
      {
        id: 'MainDiagnosis',
        extension: [{ url: SD('ExtensionDiagnosisType'), valueCoding: { system: CS('RIPSTipoDiagnosticoPrincipalVersion2'), code: '02', display: 'Confirmado Nuevo' } }],
        condition: { reference: `#${idCondition}` },
        use: { coding: [{ system: CS('ColombianDiagnosisRole'), code: '8319008', display: 'diagnóstico primario' }] },
        rank: 1,
      },
    ],
    location: [{ location: { reference: `#${idLocation}` } }],
    serviceProvider: { reference: `#${idOrganizacion}` },
  };

  const documentReference: Json = {
    resourceType: 'DocumentReference',
    id: idDocumentReference,
    meta: { profile: [SD('DocumentReferenceEPIRDA')] },
    text: { status: 'generated', div: "<div xmlns='http://www.w3.org/1999/xhtml'>Resumen de la consulta</div>" },
    status: 'current',
    type: {
      coding: [
        { system: LOINC, code: '18842-5', display: 'Discharge summary' },
        { system: CS('ColombianDocumentTypes'), code: 'EPI', display: 'Epicrisis' },
      ],
    },
    category: [{ coding: [{ system: LOINC, code: '55108-5', display: 'Clinical presentation Document' }] }],
    subject: { reference: `#${idPaciente}` },
    date: fechaCO(fin),
    author: [{ reference: `#${idOrganizacion}` }],
    custodian: { reference: 'Organization/MinSalud' },
    description: 'Epicrisis del encuentro de atención en salud - RDA',
    securityLabel: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'R', display: 'restricted' }] }],
    content: [{ attachment: { data: d.pdfBase64 }, format: { system: 'urn:ietf:bcp:13', code: 'application/pdf', display: 'PDF' } }],
  };

  const vacia = (title: string, code: string, display: string, texto: string): Json => ({
    title,
    code: { coding: [{ system: LOINC, code, display }] },
    text: { status: 'generated', div: `<div xmlns='http://www.w3.org/1999/xhtml'>${texto}</div>` },
    emptyReason: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/list-empty-reason', code: 'nilknown', display: 'Nil Known' }] },
  });

  const secciones: Json[] = [
    vacia('Entidad(es) responsable(s) por el plan de beneficios en salud (consulta)', '48768-6', 'Payment sources Document', 'No se registró entidad pagadora'),
    vacia('Otros datos demográficos', '74208-0', 'Demographic information + History of occupation Document', 'Sin datos de ocupación'),
    vacia('Datos incapacidad (SIPE – Sistema de Incapacidades y Prestaciones Economicas)', '105583-9', 'Worker Sick leave form', 'Sin incapacidad otorgada en esta consulta'),
    {
      title: 'Historial de diagnósticos de problemas de salud',
      code: { coding: [{ system: LOINC, code: '11450-4', display: 'Problem list - Reported' }] },
      entry: [{ reference: `#${idCondition}` }],
    },
    vacia('Historial de alergias, intolerancias y reacciones adversas', '48765-2', 'Allergies and adverse reactions Document', 'No se reportan alergias en esta consulta'),
    vacia('Factores de riesgo', '75492-9', 'Risk assessment and screening note', 'Sin factores de riesgo registrados en esta consulta'),
    vacia('Historial de medicamentos', '10160-0', 'History of Medication use Narrative', 'Sin medicamentos formulados en esta consulta'),
    hayProcedimiento
      ? {
          title: 'Órdenes, prescripciones o solicitudes de servicio',
          code: { coding: [{ system: LOINC, code: '61146-1', display: 'Orders for services Document' }] },
          entry: [{ reference: `#${idServiceRequest}` }],
        }
      : vacia('Órdenes, prescripciones o solicitudes de servicio', '61146-1', 'Orders for services Document', 'Sin órdenes adicionales para esta consulta'),
    {
      title: 'Documentos de soporte',
      code: { coding: [{ system: LOINC, code: '55107-7', display: 'Addendum Document' }] },
      entry: [{ reference: `#${idDocumentReference}` }],
    },
  ];

  const composition: Json = {
    resourceType: 'Composition',
    meta: { profile: [SD('CompositionAmbulatoryRDA')] },
    status: 'final',
    type: { coding: [{ system: LOINC, code: '51845-6', display: 'Outpatient Consult note' }] },
    subject: { reference: `#${idPaciente}` },
    encounter: { reference: `#${idEncounter}` },
    date: fechaCO(fin),
    author: [{ reference: `#${idPractitioner}` }],
    title: `RDA Consulta Externa - ${d.prestador.nombre}`,
    confidentiality: 'N',
    attester: [{ mode: 'legal', party: { reference: `#${idOrganizacion}` } }],
    custodian: { reference: `#${idOrganizacion}` },
    event: [{ period: { start: fechaCO(inicio), end: fechaCO(fin) } }],
    section: secciones,
  };

  const location: Json = {
    resourceType: 'Location',
    id: idLocation,
    meta: { profile: [SD('CareDeliveryLocationRDA')] },
    identifier: [{ use: 'official', system: `https://fhir.minsalud.gov.co/rda/NamingSystem/REPS`, value: idLocation }],
    status: 'active',
    name: d.prestador.nombre,
    managingOrganization: { reference: `#${idOrganizacion}` },
  };

  const entry: Json[] = [
    envolver(composition),
    envolver(construirPatient(idPaciente, d.paciente, { direccionSoloConMunicipio: true })),
    envolver(construirOrganization(idOrganizacion, d.prestador)),
    envolver(construirPractitioner(idPractitioner, d.especialista)),
    envolver(location),
    envolver(condition),
  ];
  if (serviceRequest) entry.push(envolver(serviceRequest));
  entry.push(envolver(encounter), envolver(documentReference));

  return { resourceType: 'Bundle', language: 'es-CO', type: 'document', entry };
}

const BASE_ENCOUNTERS = 'https://fhir.minsalud.gov.co/rda/NamingSystem/Encounters';

/**
 * Del OperationOutcome de MinSalud saca el display oficial del CIE-10 cuando rechaza con
 * "Code 'X' from system 'http://hl7.org/fhir/sid/icd-10' has incorrect display '…', should be '…'".
 */
export function displayOficialCie10(respuesta: string, codigo: string): string | null {
  if (!respuesta || !codigo) return null;
  const esc = codigo.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`Code '${esc}' from system 'http://hl7\\.org/fhir/sid/icd-10' has incorrect display '.*?', should be '(.+?)'`);
  try {
    const textos: string[] = [];
    const recorrer = (n: unknown) => {
      if (typeof n === 'string') textos.push(n);
      else if (Array.isArray(n)) n.forEach(recorrer);
      else if (n && typeof n === 'object') Object.values(n).forEach(recorrer);
    };
    recorrer(JSON.parse(respuesta));
    for (const t of textos) {
      const m = re.exec(t);
      if (m) return m[1];
    }
  } catch {
    const m = re.exec(respuesta);
    if (m) return m[1];
  }
  return null;
}
