import { BirdCreateInput, BirdCreateOutput } from '@/core/bird/use-cases/bird-create'
import { BirdDeleteInput, BirdDeleteOutput } from '@/core/bird/use-cases/bird-delete'
import { BirdGetByIdInput, BirdGetByIdOutput } from '@/core/bird/use-cases/bird-get-by-id'
import { BirdListInput, BirdListOutput } from '@/core/bird/use-cases/bird-list'
import { BirdUpdateInput, BirdUpdateOutput } from '@/core/bird/use-cases/bird-update'
import { IUsecase } from '@/utils/usecase'

export abstract class IBirdCreateAdapter implements IUsecase {
  abstract execute(input: BirdCreateInput): Promise<BirdCreateOutput>
}

export abstract class IBirdUpdateAdapter implements IUsecase {
  abstract execute(input: BirdUpdateInput): Promise<BirdUpdateOutput>
}

export abstract class IBirdGetByIdAdapter implements IUsecase {
  abstract execute(input: BirdGetByIdInput): Promise<BirdGetByIdOutput>
}

export abstract class IBirdListAdapter implements IUsecase {
  abstract execute(input: BirdListInput): Promise<BirdListOutput>
}

export abstract class IBirdDeleteAdapter implements IUsecase {
  abstract execute(input: BirdDeleteInput): Promise<BirdDeleteOutput>
}
