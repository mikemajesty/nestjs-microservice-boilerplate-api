import { BaseEntity } from '@/utils/entity'
import { Infer, InputValidator } from '@/utils/validator'

const ID = InputValidator.uuid()
const Name = InputValidator.string().trim().min(1).max(200)
const CreatedAt = InputValidator.date().nullish()
const UpdatedAt = InputValidator.date().nullish()
const DeletedAt = InputValidator.date().nullish()

export const BirdEntitySchema = InputValidator.object({
  id: ID,
  name: Name,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
})

type Bird = Infer<typeof BirdEntitySchema>

export class BirdEntity extends BaseEntity<BirdEntity>() {
  name!: Bird['name']

  constructor(entity: Bird) {
    super(BirdEntitySchema)
    this.validate(entity)
    this.ensureID()
  }
}
