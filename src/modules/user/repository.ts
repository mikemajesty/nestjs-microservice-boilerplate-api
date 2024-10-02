import { Injectable } from '@nestjs/common';
import { FindOptionsRelations, FindOptionsWhere, Not, Repository } from 'typeorm';

import { UserEntity } from '@/core/user/entity/user';
import { IUserRepository } from '@/core/user/repository/user';
import { UserListInput, UserListOutput } from '@/core/user/use-cases/user-list';
import { UserSchema } from '@/infra/database/postgres/schemas/user';
import { TypeORMRepository } from '@/infra/repository/postgres/repository';
import { ConvertTypeOrmFilter, SearchTypeEnum, ValidateDatabaseSortAllowed } from '@/utils/decorators';
import { calculateSkip } from '@/utils/pagination';

type Model = UserSchema & UserEntity;

@Injectable()
export class UserRepository extends TypeORMRepository<Model> implements IUserRepository {
  constructor(readonly repository: Repository<Model>) {
    super(repository);
  }

  async existsOnUpdate(
    equalFilter: Pick<UserEntity, 'email'>,
    notEqualFilter: Pick<UserEntity, 'id'>
  ): Promise<boolean> {
    const exists = await this.repository.exists({ where: { id: Not(notEqualFilter.id), email: equalFilter.email } });

    return exists;
  }

  async findOneWithRelation(
    filter: Partial<UserEntity>,
    relations: { [key in keyof Partial<UserEntity>]: boolean }
  ): Promise<UserEntity> {
    return await this.repository.findOne({
      where: filter as FindOptionsWhere<unknown>,
      relations: relations as FindOptionsRelations<unknown>
    });
  }

  async softRemove(entity: Partial<UserEntity>): Promise<UserEntity> {
    return await this.repository.softRemove(entity);
  }

  @ConvertTypeOrmFilter<UserEntity>([
    { name: 'email', type: SearchTypeEnum.like },
    { name: 'name', type: SearchTypeEnum.like }
  ])
  @ValidateDatabaseSortAllowed<UserEntity>('email', 'name', 'createdAt')
  async paginate(input: UserListInput): Promise<UserListOutput> {
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
