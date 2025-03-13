import { PermissionEntity } from '@/core/permission/entity/permission';
import { IPermissionRepository } from '@/core/permission/repository/permission';
import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';
import { UUIDUtils } from '@/utils/uuid';
import { Infer, InputValidator } from '@/utils/validator';

import { RoleEntity, RoleEntitySchema } from '../entity/role';
import { IRoleRepository } from '../repository/role';

export const RoleAddPermissionSchema = RoleEntitySchema.pick({
  id: true
}).merge(InputValidator.object({ permissions: InputValidator.array(InputValidator.string()) }));

export class RoleAddPermissionUsecase implements IUsecase {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly permissionRepository: IPermissionRepository
  ) {}

  @ValidateSchema(RoleAddPermissionSchema)
  async execute(input: RoleAddPermissionInput): Promise<RoleAddPermissionOutput> {
    const role = await this.roleRepository.findOne({ id: input.id });

    if (!role) {
      throw new ApiNotFoundException('roleNotFound');
    }

    const entity = new RoleEntity(role);

    const permissions = await this.permissionRepository.findIn({ name: input.permissions });

    for (const permission of input.permissions) {
      const permissionAlreadyCreated = permissions.find((p) => p.name === permission);

      if (!permissionAlreadyCreated) {
        const newPermission = new PermissionEntity({ id: UUIDUtils.create(), name: permission });
        entity.permissions.push(newPermission);
        continue;
      }

      const permissionAlreadyAssociated = entity.permissions.find((p) => p.name === permission);

      if (permissionAlreadyAssociated) {
        continue;
      }

      entity.permissions.push(permissionAlreadyCreated);
    }

    await this.roleRepository.create(entity);
  }
}

export type RoleAddPermissionInput = Infer<typeof RoleAddPermissionSchema>;
export type RoleAddPermissionOutput = void;
