import { IRepository } from '@/infra/repository';

import { PermissionEntity } from '../entity/permission';
import { PermissionListInput, PermissionListOutput } from '../use-cases/permission-list';

export type ExistsOnUpdateInput = {
  idNotEquals: string;
  nameEquals: string;
};

export abstract class IPermissionRepository extends IRepository<PermissionEntity> {
  abstract existsOnUpdate(input: ExistsOnUpdateInput): Promise<boolean>;
  abstract paginate(input: PermissionListInput): Promise<PermissionListOutput>;
  abstract findOneWithRelation(
    filter: Partial<PermissionEntity>,
    relations: { [key in keyof Partial<PermissionEntity>]: true | false }
  ): Promise<PermissionEntity>;
}
