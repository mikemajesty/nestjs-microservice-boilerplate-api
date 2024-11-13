import { PermissionCreateInput, PermissionCreateOutput } from '@/core/permission/use-cases/permission-create';
import { PermissionDeleteInput, PermissionDeleteOutput } from '@/core/permission/use-cases/permission-delete';
import { PermissionGetByIdInput, PermissionGetByIdOutput } from '@/core/permission/use-cases/permission-get-by-id';
import { PermissionListInput, PermissionListOutput } from '@/core/permission/use-cases/permission-list';
import { PermissionUpdateInput, PermissionUpdateOutput } from '@/core/permission/use-cases/permission-update';
import { IUsecase } from '@/utils/usecase';

export abstract class IPermissionCreateAdapter implements IUsecase {
  abstract execute(input: PermissionCreateInput): Promise<PermissionCreateOutput>;
}

export abstract class IPermissionUpdateAdapter implements IUsecase {
  abstract execute(input: PermissionUpdateInput): Promise<PermissionUpdateOutput>;
}

export abstract class IPermissionGetByIdAdapter implements IUsecase {
  abstract execute(input: PermissionGetByIdInput): Promise<PermissionGetByIdOutput>;
}

export abstract class IPermissionListAdapter implements IUsecase {
  abstract execute(input: PermissionListInput): Promise<PermissionListOutput>;
}

export abstract class IPermissionDeleteAdapter implements IUsecase {
  abstract execute(input: PermissionDeleteInput): Promise<PermissionDeleteOutput>;
}

export abstract class IPermissionCreateCloneCascaDeBalaAdapter implements IUsecase {
  abstract execute(input: PermissionDeleteInput): Promise<PermissionDeleteOutput>;
}
