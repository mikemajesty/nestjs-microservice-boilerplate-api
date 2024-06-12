import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, Repository } from 'typeorm';

import { RoleEntity } from '@/core/role/entity/role';
import { IRoleRepository } from '@/core/role/repository/role';
import { RoleListInput, RoleListOutput } from '@/core/role/use-cases/role-list';
import { ICacheAdapter } from '@/infra/cache';
import { RoleSchema } from '@/infra/database/postgres/schemas/role';
import { TypeORMRepository } from '@/infra/repository/postgres/repository';
import { SearchTypeEnum, ValidateDatabaseSortAllowed, ValidateMongooseFilter } from '@/utils/decorators';
import { calculateSkip } from '@/utils/pagination';

type Model = RoleSchema & RoleEntity;

@Injectable()
export class RoleRepository extends TypeORMRepository<Model> implements IRoleRepository {
  constructor(
    readonly repository: Repository<Model>,
    private readonly cache: ICacheAdapter
  ) {
    super(repository);
  }

  async findWithCache(role: string): Promise<string[]> {
    const roleKey = `role_${role}`;
    const roleCached = await this.cache.get(roleKey);

    if (roleCached) {
      return JSON.parse(roleCached);
    }

    const roleDatabase = await this.findOne({ name: role });

    const permissions = roleDatabase.permissions.map((p) => p.name);

    const SECONDS = 86400;
    await this.cache.set(roleKey, JSON.stringify(permissions), { EX: SECONDS });
    return permissions;
  }

  @ValidateMongooseFilter<RoleEntity>([{ name: 'name', type: SearchTypeEnum.like }])
  @ValidateDatabaseSortAllowed<RoleEntity>('name', 'createdAt')
  async paginate(input: RoleListInput): Promise<RoleListOutput> {
    const skip = calculateSkip(input);

    const [docs, total] = await this.repository.findAndCount({
      take: input.limit,
      skip,
      order: input.sort,
      where: input.search as FindOptionsWhere<unknown>
    });

    return { docs, total, page: input.page, limit: input.limit };
  }
}
