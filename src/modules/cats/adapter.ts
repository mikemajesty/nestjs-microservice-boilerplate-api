import { CatsCreateInput, CatsCreateOutput } from '@/core/cats/use-cases/cats-create';
import { CatsDeleteInput, CatsDeleteOutput } from '@/core/cats/use-cases/cats-delete';
import { CatsGetByIDInput, CatsGetByIDOutput } from '@/core/cats/use-cases/cats-getByID';
import { CatsListInput, CatsListOutput } from '@/core/cats/use-cases/cats-list';
import { CatsUpdateInput, CatsUpdateOutput } from '@/core/cats/use-cases/cats-update';
import { ApiTrancingInput } from '@/utils/request';

export abstract class ICatsCreateAdapter {
  abstract execute(input: CatsCreateInput, trace: ApiTrancingInput): Promise<CatsCreateOutput>;
}

export abstract class ICatsUpdateAdapter {
  abstract execute(input: CatsUpdateInput, trace: ApiTrancingInput): Promise<CatsUpdateOutput>;
}

export abstract class ICatsGetByIDAdapter {
  abstract execute(input: CatsGetByIDInput): Promise<CatsGetByIDOutput>;
}

export abstract class ICatsListAdapter {
  abstract execute(input: CatsListInput): Promise<CatsListOutput>;
}

export abstract class ICatsDeleteAdapter {
  abstract execute(input: CatsDeleteInput, trace: ApiTrancingInput): Promise<CatsDeleteOutput>;
}
