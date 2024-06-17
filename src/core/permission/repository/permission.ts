import { IRepository } from '@/infra/repository';

import { PermissionEntity } from '../entity/permission';
import { PermissionListInput, PermissionListOutput } from '../use-cases/permission-list';

export abstract class IPermissionRepository extends IRepository<PermissionEntity> {
  abstract paginate(input: PermissionListInput): Promise<PermissionListOutput>;
}
