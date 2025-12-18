/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/entity.md
 */
import { BaseEntity } from '@/utils/entity'
import { Infer, InputValidator } from '@/utils/validator'

const ID = InputValidator.uuid()
const Name = InputValidator.string().trim().min(1).max(200)
const Breed = InputValidator.string().trim().min(1).max(200)
const Age = InputValidator.int().min(0).max(30)
const CreatedAt = InputValidator.date().nullish()
const UpdatedAt = InputValidator.date().nullish()
const DeletedAt = InputValidator.date().nullish()

export const CatEntitySchema = InputValidator.object({
  id: ID,
  name: Name,
  breed: Breed,
  age: Age,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
})

type Cat = Infer<typeof CatEntitySchema>

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
