/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/entity.md
 */
import { RoleEntity, RoleEntitySchema, RoleEnum } from '@/core/role/entity/role'
import { BaseEntity } from '@/utils/domain'
import { InferSchema, Schema } from '@/utils/schema'

const ID = Schema.uuid()
const Name = Schema.string()
  .transform((value) => value.trim().replace(/ /g, '_').toLowerCase())
  .refine((val) => val.includes(':'), {
    message: "permission must contains ':'"
  })
const CreatedAt = Schema.date().nullish().optional()
const UpdatedAt = Schema.date().nullish().optional()
const DeletedAt = Schema.date().nullish().optional()

export const PermissionEntitySchema = Schema.object({
  id: ID,
  name: Name,
  // Getter defers reading RoleEntitySchema until parse time, avoiding the circular import error
  // while keeping type inference. `.omit({ permissions: true })` cuts the Permission <-> Role cycle:
  // without it the mock generator recurses forever. Careful: nested `permissions` are stripped on parse.
  get roles() {
    return Schema.array(RoleEntitySchema.omit({ permissions: true }))
      .or(Schema.array(Schema.enum(RoleEnum)))
      .optional()
  },
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
})

type Permission = InferSchema<typeof PermissionEntitySchema>

export class PermissionEntity extends BaseEntity<PermissionEntity>() {
  name!: Permission['name']

  roles?: RoleEntity[] | RoleEnum[]

  constructor(entity: Permission) {
    super(PermissionEntitySchema)
    this.validate(entity)
    this.ensureID()
  }

  removeAllRoles() {
    delete this.roles
  }
}
