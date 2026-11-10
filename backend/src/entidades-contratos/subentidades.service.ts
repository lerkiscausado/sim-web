import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subentidades } from './entities/subentidades.entity';
import { Contratos } from './entities/contratos.entity';
import { EstadoActivoInactivoEliminado } from '../common/enums/estado.enum';

/** Subentidades de un contrato (frmSubEntidades): IPS/clínica/aseguradora por la que llega el paciente. */
@Injectable()
export class SubentidadesService {
  constructor(
    @InjectRepository(Subentidades)
    private readonly repo: Repository<Subentidades>,
    @InjectRepository(Contratos)
    private readonly contratosRepo: Repository<Contratos>,
  ) {}

  /** Activas de un contrato (para el combo de la orden). */
  findByContrato(idContrato: number) {
    return this.repo.find({
      where: { idContrato, estado: EstadoActivoInactivoEliminado.ACTIVO },
      order: { nombre: 'ASC' },
    });
  }

  /** Todas (activas e inactivas, sin eliminadas) para administrarlas. */
  findTodasDeContrato(idContrato: number) {
    return this.repo
      .createQueryBuilder('s')
      .where('s.idContrato = :idContrato', { idContrato })
      .andWhere('s.estado <> :e', { e: EstadoActivoInactivoEliminado.ELIMINADO })
      .orderBy('s.nombre', 'ASC')
      .getMany();
  }

  private normalizar(nombre: string) {
    const n = (nombre ?? '').trim().replace(/\s+/g, ' ').toUpperCase();
    if (!n) throw new BadRequestException('El nombre de la subentidad es obligatorio');
    if (n.length > 60) throw new BadRequestException('El nombre no puede superar 60 caracteres');
    return n;
  }

  private async validarDuplicado(idContrato: number, nombre: string, excluirId?: number) {
    const qb = this.repo
      .createQueryBuilder('s')
      .where('s.idContrato = :idContrato', { idContrato })
      .andWhere('UPPER(TRIM(s.nombre)) = :nombre', { nombre })
      .andWhere('s.estado <> :e', { e: EstadoActivoInactivoEliminado.ELIMINADO });
    if (excluirId) qb.andWhere('s.id <> :id', { id: excluirId });
    if (await qb.getCount()) throw new ConflictException(`Ya existe la subentidad "${nombre}" en este contrato`);
  }

  async create(idContrato: number, nombre: string) {
    const contrato = await this.contratosRepo.findOne({ where: { id: idContrato } });
    if (!contrato) throw new NotFoundException(`Contrato ${idContrato} no encontrado`);
    const n = this.normalizar(nombre);
    await this.validarDuplicado(idContrato, n);
    return this.repo.save(this.repo.create({ idContrato, nombre: n, estado: EstadoActivoInactivoEliminado.ACTIVO }));
  }

  async update(id: number, nombre: string) {
    const sub = await this.repo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Subentidad no encontrada');
    const n = this.normalizar(nombre);
    await this.validarDuplicado(sub.idContrato, n, id);
    sub.nombre = n;
    return this.repo.save(sub);
  }

  async cambiarEstado(id: number, estado: EstadoActivoInactivoEliminado) {
    const sub = await this.repo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Subentidad no encontrada');
    sub.estado = estado;
    return this.repo.save(sub);
  }
}
