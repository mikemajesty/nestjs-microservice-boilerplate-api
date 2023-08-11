import { BirdCreateInput, BirdCreateOutput } from '@/core/bird/use-cases/bird-create';
import { BirdDeleteInput, BirdDeleteOutput } from '@/core/bird/use-cases/bird-delete';
import { BirdGetByIDInput, BirdGetByIDOutput } from '@/core/bird/use-cases/bird-getByID';
import { BirdListInput, BirdListOutput } from '@/core/bird/use-cases/bird-list';
import { BirdUpdateInput, BirdUpdateOutput } from '@/core/bird/use-cases/bird-update';

export abstract class IBirdCreateAdapter {
  abstract execute(input: BirdCreateInput): Promise<BirdCreateOutput>;
}

export abstract class IBirdUpdateAdapter {
  abstract execute(input: BirdUpdateInput): Promise<BirdUpdateOutput>;
}

export abstract class IBirdListAdapter {
  abstract execute(input: BirdListInput): Promise<BirdListOutput>;
}

export abstract class IBirdDeleteAdapter {
  abstract execute(input: BirdDeleteInput): Promise<BirdDeleteOutput>;
}

export abstract class IBirdGetByIDAdapter {
  abstract execute(input: BirdGetByIDInput): Promise<BirdGetByIDOutput>;
}
