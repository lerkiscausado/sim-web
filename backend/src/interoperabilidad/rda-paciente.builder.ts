import {
  CS, Json, LOINC, PacienteRda, PrestadorRda, SD, construirOrganization, construirPatient, envolver, fechaCO, sanitizarId, vacio,
} from './rda-comun';
import { clasificarAntecedentesPersonales, detectarParentesco, extraerAntecedentesFamiliares } from './rda-texto';

/**
 * Bundle "document" del RDA-Paciente (CompositionPatientStatementRDA, LOINC 102089-0):
 * antecedentes manifestados por el paciente. Port de RDABundleBuilder.vb.
 *
 * - Composition.author = el paciente (cardinalidad 1..1). El Practitioner NO se incluye:
 *   ningún campo del Composition lo puede referenciar y un recurso huérfano se rechaza (BUNDLE-005).
 * - attester: máximo uno, modo fijo "legal", la organización.
 * - Secciones sin datos: emptyReason "nilknown" + text (cmp-1).
 */
export function construirBundlePaciente(a: {
  paciente: PacienteRda;
  prestador: PrestadorRda;
  antecedentesPersonales?: string | null;
  antecedentesFamiliares?: string | null;
  ahora?: Date;
}): Json {
  const { paciente, prestador } = a;
  if (!paciente) throw new Error('No se encontró información del paciente para armar el RDA.');
  if (vacio(prestador.codigoPrestadorReps)) {
    throw new Error("Falta configurar el 'Código de habilitación del prestador (REPS)' en Interoperabilidad RDA.");
  }
  const ahora = a.ahora ?? new Date();
  const idPaciente = sanitizarId(`${paciente.idTipoIdentificacion}-${paciente.identificacion}`);
  const idOrganizacion = sanitizarId(prestador.codigoPrestadorReps);

  const { alergias, medicamentos, condiciones } = clasificarAntecedentesPersonales(a.antecedentesPersonales);
  const familiares = extraerAntecedentesFamiliares(a.antecedentesFamiliares);

  const recursos: Json[] = [];
  const refs = (prefijo: string, items: string[], construir: (id: string, texto: string) => Json) =>
    items.map((texto, i) => {
      const id = `${prefijo}-${i}`;
      recursos.push(envolver(construir(id, texto)));
      return { reference: `#${id}` };
    });

  const refCondition = refs('Condition', condiciones, (id, texto) => ({
    resourceType: 'Condition',
    id,
    meta: { profile: [SD('ConditionStatementRDA')] },
    clinicalStatus: { coding: [{ code: 'active', system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', display: 'Active' }] },
    verificationStatus: { coding: [{ code: 'unconfirmed', display: 'Unconfirmed' }] },
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'encounter-diagnosis', display: 'Encounter Diagnosis' }] }],
    code: { text: texto },
    subject: { reference: `#${idPaciente}` },
  }));
  const refAllergy = refs('AllergyIntolerance', alergias, (id, texto) => ({
    resourceType: 'AllergyIntolerance',
    id,
    meta: { profile: [SD('AllergyIntoleranceStatementRDA')] },
    clinicalStatus: { coding: [{ code: 'active', display: 'Active' }] },
    verificationStatus: { coding: [{ code: 'unconfirmed', display: 'Unconfirmed' }] },
    code: { text: texto },
    patient: { reference: `#${idPaciente}` },
  }));
  const refMedication = refs('MedicationStatement', medicamentos, (id, texto) => ({
    resourceType: 'MedicationStatement',
    id,
    meta: { profile: [SD('MedicationStatementRDA')] },
    status: 'completed',
    medicationCodeableConcept: { text: texto },
    subject: { reference: `#${idPaciente}` },
  }));
  const refFamily = refs('FamilyMemberHistory', familiares, (id, texto) => {
    // Sin código "otro" en ParentescoAntecedente: si no se detecta, "01 Padres" (igual que el escritorio).
    const par = detectarParentesco(texto) ?? { codigo: '01', display: 'Padres' };
    return {
      resourceType: 'FamilyMemberHistory',
      id,
      meta: { profile: [SD('FamilyMemberHistoryRDA')] },
      status: 'partial',
      patient: { reference: `#${idPaciente}` },
      relationship: { coding: [{ system: CS('ParentescoAntecedente'), code: par.codigo, display: par.display }] },
      condition: [{ code: { text: texto } }],
    };
  });

  const seccion = (title: string, code: string, display: string, entry: Json[]): Json => {
    const s: Json = { title, code: { coding: [{ system: LOINC, code, display }] } };
    if (entry.length) s.entry = entry;
    else {
      s.emptyReason = { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/list-empty-reason', code: 'nilknown', display: 'Nil Known' }] };
      s.text = {
        status: 'generated',
        div: "<div xmlns='http://www.w3.org/1999/xhtml'>No existen elementos conocidos para esta lista y/o el paciente no declara información</div>",
      };
    }
    return s;
  };

  const composition: Json = {
    resourceType: 'Composition',
    meta: { profile: [SD('CompositionPatientStatementRDA')] },
    status: 'final',
    type: { coding: [{ system: LOINC, code: '102089-0', display: 'FHIR resource patient medical record' }] },
    subject: { reference: `#${idPaciente}` },
    date: fechaCO(ahora),
    author: [{ reference: `#${idPaciente}` }],
    title: 'Resumen Digital de Atención en Salud - RDA de antecedentes manifestados por el paciente',
    confidentiality: 'N',
    attester: [{ mode: 'legal', party: { reference: `#${idOrganizacion}` } }],
    custodian: { reference: `#${idOrganizacion}` },
    event: [
      {
        code: [
          { id: 'eventCodeModality', coding: [{ system: CS('ColombianTechModality'), code: '01', display: 'Intramural' }] },
          { id: 'eventCodeServiceGroup', coding: [{ system: CS('GrupoServicios'), code: '01', display: 'Consulta externa' }] },
        ],
        period: { start: fechaCO(new Date(ahora.getTime() - 5 * 60000)), end: fechaCO(ahora) },
      },
    ],
    section: [
      seccion('Historial de diagnósticos de problemas de salud', '11450-4', 'Problem list - Reported', refCondition),
      seccion('Historial de alergias, intolerancias y reacciones adversas', '48765-2', 'Allergies and adverse reactions Document', refAllergy),
      seccion('Historial de medicamentos', '10160-0', 'History of Medication use Narrative', refMedication),
      seccion('Historial de antecedentes familiares', '10157-6', 'History of family member diseases Narrative', refFamily),
    ],
  };

  return {
    resourceType: 'Bundle',
    language: 'es-CO',
    type: 'document',
    entry: [
      envolver(composition),
      envolver(construirPatient(idPaciente, paciente)),
      envolver(construirOrganization(idOrganizacion, prestador)),
      ...recursos,
    ],
  };
}
