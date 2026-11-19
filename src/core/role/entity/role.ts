/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/entity.md
 */
import { PermissionEntity, PermissionEntitySchema } from '@/core/permission/entity/permission'
import { BaseEntity } from '@/utils/domain'
import { InferSchema, Schema } from '@/utils/schema'

export enum RoleEnum {
  USER = 'USER',
  BACKOFFICE = 'BACKOFFICE'
}

const ID = Schema.uuid()
const Name = Schema.string().transform((value) => value.trim().replace(/ /g, '_').toUpperCase())
const CreatedAt = Schema.date().nullish()
const UpdatedAt = Schema.date().nullish()
const DeletedAt = Schema.date().optional().nullish()

export const RoleEntitySchema = Schema.object({
  id: ID,
  name: Name,
  // Getter defers reading PermissionEntitySchema until parse time, avoiding the circular import error
  // while keeping type inference. `.omit({ roles: true })` cuts the Role <-> Permission cycle:
  // without it the mock generator recurses forever. Careful: nested `roles` are stripped on parse.
  get permissions() {
    return Schema.array(PermissionEntitySchema.omit({ roles: true })).optional()
  },
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
})

type Role = InferSchema<typeof RoleEntitySchema>

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
