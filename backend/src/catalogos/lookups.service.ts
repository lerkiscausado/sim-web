import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Mapa de tablas de catálogo simples (una columna ID + una columna "nombre")
 * habilitadas para el endpoint genérico de lookup. Whitelist explícita para
 * no exponer un endpoint de "SELECT de cualquier tabla" sin control.
 */
const LOOKUP_TABLES: Record<string, { idCol: string; nameCol: string; estadoCol?: string }> = {
  'causa-externa': { idCol: 'ID', nameCol: 'NOMBRE_CAUSA_EXTERNA' },
  'finalidad-consulta': { idCol: 'ID', nameCol: 'NOMBRE_FINALIDAD' },
  'finalidad-procedimiento': { idCol: 'ID', nameCol: 'NOMBRE_FINALIDAD_PROCEDIMIENTO' },
  'ambito-procedimiento': { idCol: 'ID', nameCol: 'NOMBRE_AMBITO_PROCEDIMIENTO' },
  'tipo-diagnostico': { idCol: 'ID', nameCol: 'NOMBRE_TIPO_DIAGNOSTICO' },
  'forma-realizacion': { idCol: 'ID', nameCol: 'FORMA_REALIZACION', estadoCol: 'ESTADO' },
  'persona-atiende': { idCol: 'ID', nameCol: 'NOMBRE_PERSONA_ATIENDE' },
  ingreso: { idCol: 'ID', nameCol: 'NOMBRE_INGRESO' },
  'tipo-afiliado': { idCol: 'ID', nameCol: 'NOMBRE_TIPO_AFILIADO' },
  'tipo-usuario': { idCol: 'ID', nameCol: 'NOMBRE_TIPO_USUARIO' },
  'revision-sistemas': { idCol: 'ID', nameCol: 'NOMBRE', estadoCol: 'ESTADO' },
  'via-administracion': { idCol: 'ID', nameCol: 'NOMBRE', estadoCol: 'ESTADO' },
};

const TABLE_NAME_MAP: Record<string, string> = {
  'causa-externa': 'causa_externa',
  'finalidad-consulta': 'finalidad_consulta',
  'finalidad-procedimiento': 'finalidad_procedimiento',
  'ambito-procedimiento': 'ambito_procedimiento',
  'tipo-diagnostico': 'tipo_diagnostico',
  'forma-realizacion': 'forma_realizacion',
  'persona-atiende': 'persona_atiende',
  ingreso: 'ingreso',
  'tipo-afiliado': 'tipo_afiliado',
  'tipo-usuario': 'tipo_usuario',
  'revision-sistemas': 'revision_sistemas',
  'via-administracion': 'via_administracion',
};

@Injectable()
export class LookupsService {
  constructor(private readonly dataSource: DataSource) {}

  static readonly TABLAS_DISPONIBLES = Object.keys(LOOKUP_TABLES);

  async findAll(tabla: string) {
    const config = LOOKUP_TABLES[tabla];
    const tableName = TABLE_NAME_MAP[tabla];
    if (!config || !tableName) {
      throw new BadRequestException(
        `Catálogo '${tabla}' no disponible. Use uno de: ${LookupsService.TABLAS_DISPONIBLES.join(', ')}`,
      );
    }
    const where = config.estadoCol ? `WHERE \`${config.estadoCol}\` = 'A'` : '';
    const rows = await this.dataSource.query(
      `SELECT \`${config.idCol}\` AS id, \`${config.nameCol}\` AS nombre FROM \`${tableName}\` ${where} ORDER BY \`${config.nameCol}\` ASC`,
    );
    return rows;
  }
}
