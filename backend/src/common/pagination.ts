import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Aplica take/skip a un QueryBuilder ya armado (where/order incluidos) y devuelve el resultado paginado. */
export async function paginate<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedResult<T>> {
  const take = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
  const currentPage = Math.max(page, 1);
  const skip = (currentPage - 1) * take;

  const [data, total] = await qb.take(take).skip(skip).getManyAndCount();
  return { data, total, page: currentPage, pageSize: take };
}
