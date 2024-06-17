import { IRepository } from '@/infra/repository';

import { RoleEntity } from '../entity/role';
import { RoleListInput, RoleListOutput } from '../use-cases/role-list';

export abstract class IRoleRepository extends IRepository<RoleEntity> {
  abstract paginate(input: RoleListInput): Promise<RoleListOutput>;
}
