/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/adapter.md
 */
import { PermissionCreateInput, PermissionCreateOutput } from '@/core/permission/use-cases/permission-create'
import { PermissionDeleteInput, PermissionDeleteOutput } from '@/core/permission/use-cases/permission-delete'
import { PermissionGetByIdInput, PermissionGetByIdOutput } from '@/core/permission/use-cases/permission-get-by-id'
import { PermissionListInput, PermissionListOutput } from '@/core/permission/use-cases/permission-list'
import { PermissionUpdateInput, PermissionUpdateOutput } from '@/core/permission/use-cases/permission-update'
import { IUsecase } from '@/utils/usecase'

export abstract class IPermissionCreate implements IUsecase {
  abstract execute(input: PermissionCreateInput): Promise<PermissionCreateOutput>
}

export abstract class IPermissionUpdate implements IUsecase {
  abstract execute(input: PermissionUpdateInput): Promise<PermissionUpdateOutput>
}

export abstract class IPermissionGetById implements IUsecase {
  abstract execute(input: PermissionGetByIdInput): Promise<PermissionGetByIdOutput>
}

export abstract class IPermissionList implements IUsecase {
  abstract execute(input: PermissionListInput): Promise<PermissionListOutput>
}

export abstract class IPermissionDelete implements IUsecase {
  abstract execute(input: PermissionDeleteInput): Promise<PermissionDeleteOutput>
}
