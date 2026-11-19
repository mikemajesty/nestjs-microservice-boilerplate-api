/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/entity.md
 */
import { BaseEntity } from '@/utils/domain'
import { InferSchema, Schema } from '@/utils/schema'

const ID = Schema.uuid()
const Name = Schema.string().trim().min(1).max(200)
const Breed = Schema.string().trim().min(1).max(200)
const Age = Schema.int().min(0).max(30)
const CreatedAt = Schema.date().nullish()
const UpdatedAt = Schema.date().nullish()
const DeletedAt = Schema.date().nullish()

export const CatEntitySchema = Schema.object({
  id: ID,
  name: Name,
  breed: Breed,
  age: Age,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
})

type Cat = InferSchema<typeof CatEntitySchema>

export class CatEntity extends BaseEntity<CatEntity>() {
  name!: Cat['name']

  breed!: Cat['breed']

  age!: Cat['age']

  constructor(entity: Cat) {
    super(CatEntitySchema)
    this.validate(entity)
    this.ensureID()
  }
}
