import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

const SINO = ['1', '0'];

export class UpsertCitologiaDto {
  @IsInt()
  idOrden: number;

  // Calidad de la Muestra
  @IsOptional() @IsIn(SINO) cm1?: string;
  @IsOptional() @IsIn(SINO) cm2?: string;
  @IsOptional() @IsIn(SINO) cm3?: string;
  @IsOptional() @IsIn(SINO) cm4?: string;
  @IsOptional() @IsString() cm5?: string;

  // Categorización General
  @IsOptional() @IsIn(SINO) cg1?: string;
  @IsOptional() @IsIn(SINO) cg2?: string;

  // Microorganismos
  @IsOptional() @IsIn(SINO) m1?: string;
  @IsOptional() @IsIn(SINO) m2?: string;
  @IsOptional() @IsIn(SINO) m3?: string;
  @IsOptional() @IsIn(SINO) m4?: string;
  @IsOptional() @IsIn(SINO) m5?: string;
  @IsOptional() @IsIn(SINO) m6?: string;

  // Otros Hallazgos No Neoplásicos
  @IsOptional() @IsIn(SINO) ohnn1?: string;
  @IsOptional() @IsIn(SINO) ohnn2?: string;
  @IsOptional() @IsIn(SINO) ohnn3?: string;
  @IsOptional() @IsIn(SINO) ohnn4?: string;
  @IsOptional() @IsIn(SINO) ohnn5?: string;
  @IsOptional() @IsIn(SINO) ohnn6?: string;

  // Anormalidades en Células Escamosas (ASC)
  @IsOptional() @IsIn(SINO) ace1?: string;
  @IsOptional() @IsIn(SINO) ace2?: string;
  @IsOptional() @IsIn(SINO) ace3?: string;
  @IsOptional() @IsIn(SINO) ace4?: string;
  @IsOptional() @IsIn(SINO) ace5?: string;

  // Anormalidades en Células Glandulares (AGC)
  @IsOptional() @IsIn(SINO) acg1?: string;
  @IsOptional() @IsIn(SINO) acg2?: string;
  @IsOptional() @IsIn(SINO) acg3?: string;
  @IsOptional() @IsIn(SINO) acg4?: string;
  @IsOptional() @IsIn(SINO) acg5?: string;
  @IsOptional() @IsIn(SINO) acg8?: string;

  // Flora Bacilar
  @IsOptional() @IsIn(SINO) fb1?: string;
  @IsOptional() @IsIn(SINO) fb2?: string;
  @IsOptional() @IsIn(SINO) fb3?: string;

  // Inflamación
  @IsOptional() @IsIn(SINO) i1?: string;
  @IsOptional() @IsIn(SINO) i2?: string;
  @IsOptional() @IsIn(SINO) i3?: string;

  @IsOptional() @IsString() observaciones?: string;

  /** Diagnóstico (obligatorio en la práctica, se valida en el servicio junto al resto). */
  @IsOptional() @IsString() diagnostico?: string;

  @IsOptional() @IsString() fechaSalida?: string;
}
