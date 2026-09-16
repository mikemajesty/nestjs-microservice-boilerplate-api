/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/adapter.md
 */
import { RoleAddPermissionInput, RoleAddPermissionOutput } from '@/core/role/use-cases/role-add-permission'
import { RoleCreateInput, RoleCreateOutput } from '@/core/role/use-cases/role-create'
import { RoleDeleteInput, RoleDeleteOutput } from '@/core/role/use-cases/role-delete'
import { RoleDeletePermissionInput, RoleDeletePermissionOutput } from '@/core/role/use-cases/role-delete-permission'
import { RoleGetByIdInput, RoleGetByIdOutput } from '@/core/role/use-cases/role-get-by-id'
import { RoleListInput, RoleListOutput } from '@/core/role/use-cases/role-list'
import { RoleUpdateInput, RoleUpdateOutput } from '@/core/role/use-cases/role-update'
import { IUsecase } from '@/utils/usecase'

export abstract class IRoleCreate implements IUsecase {
  abstract execute(input: RoleCreateInput): Promise<RoleCreateOutput>
}

export abstract class IRoleUpdate implements IUsecase {
  abstract execute(input: RoleUpdateInput): Promise<RoleUpdateOutput>
}

export abstract class IRoleGetById implements IUsecase {
  abstract execute(input: RoleGetByIdInput): Promise<RoleGetByIdOutput>
}

export abstract class IRoleList implements IUsecase {
  abstract execute(input: RoleListInput): Promise<RoleListOutput>
}

export abstract class IRoleDelete implements IUsecase {
  abstract execute(input: RoleDeleteInput): Promise<RoleDeleteOutput>
}

export abstract class IRoleAddPermission implements IUsecase {
  abstract execute(input: RoleAddPermissionInput): Promise<RoleAddPermissionOutput>
}

export abstract class IRoleDeletePermission implements IUsecase {
  abstract execute(input: RoleDeletePermissionInput): Promise<RoleDeletePermissionOutput>
}
