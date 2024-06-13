import { RoleAddPermissionInput, RoleAddPermissionOutput } from '@/core/role/use-cases/role-add-permission';
import { RoleCreateInput, RoleCreateOutput } from '@/core/role/use-cases/role-create';
import { RoleDeleteInput, RoleDeleteOutput } from '@/core/role/use-cases/role-delete';
import { RoleDeletePermissionInput, RoleDeletePermissionOutput } from '@/core/role/use-cases/role-delete-permission';
import { RoleGetByIdInput, RoleGetByIdOutput } from '@/core/role/use-cases/role-get-by-id';
import { RoleListInput, RoleListOutput } from '@/core/role/use-cases/role-list';
import { RoleUpdateInput, RoleUpdateOutput } from '@/core/role/use-cases/role-update';
import { IUsecase } from '@/utils/usecase';

export abstract class IRoleCreateAdapter implements IUsecase {
  abstract execute(input: RoleCreateInput): Promise<RoleCreateOutput>;
}

export abstract class IRoleUpdateAdapter implements IUsecase {
  abstract execute(input: RoleUpdateInput): Promise<RoleUpdateOutput>;
}

export abstract class IRoleGetByIdAdapter implements IUsecase {
  abstract execute(input: RoleGetByIdInput): Promise<RoleGetByIdOutput>;
}

export abstract class IRoleListAdapter implements IUsecase {
  abstract execute(input: RoleListInput): Promise<RoleListOutput>;
}

export abstract class IRoleDeleteAdapter implements IUsecase {
  abstract execute(input: RoleDeleteInput): Promise<RoleDeleteOutput>;
}

export abstract class IRoleAddPermissionAdapter implements IUsecase {
  abstract execute(input: RoleAddPermissionInput): Promise<RoleAddPermissionOutput>;
}

export abstract class IRoleDeletePermissionAdapter implements IUsecase {
  abstract execute(input: RoleDeletePermissionInput): Promise<RoleDeletePermissionOutput>;
}
