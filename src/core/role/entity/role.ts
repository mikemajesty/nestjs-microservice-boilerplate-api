/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/entity.md
 */
import { PermissionEntity, PermissionEntitySchema } from '@/core/permission/entity/permission'
import { BaseEntity } from '@/utils/entity'
import { Infer, InputValidator } from '@/utils/validator'

export enum RoleEnum {
  USER = 'USER',
  BACKOFFICE = 'BACKOFFICE'
}

const ID = InputValidator.uuid()
const Name = InputValidator.string().transform((value) => value.trim().replace(/ /g, '_').toUpperCase())
const Permissions = InputValidator.array(PermissionEntitySchema).optional()
const CreatedAt = InputValidator.date().nullish()
const UpdatedAt = InputValidator.date().nullish()
const DeletedAt = InputValidator.date().optional().nullish()

export const RoleEntitySchema = InputValidator.object({
  id: ID,
  name: Name,
  permissions: Permissions,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
})

type Role = Infer<typeof RoleEntitySchema>

export class RoleEntity extends BaseEntity<RoleEntity>() {
  name!: Role['name']

  permissions: PermissionEntity[] = []

  constructor(entity: Role) {
    super(RoleEntitySchema)
    this.validate(entity)
    this.ensureID()
  }

  addPermission(permission: PermissionEntity) {
    if (this.permissions.find((p) => p.name === permission.name)) {
      return
    }

    this.permissions.push(permission)
  }

  removePermissionByName(name: string) {
    this.permissions = this.permissions.filter((p) => p.name !== name)
  }
}
