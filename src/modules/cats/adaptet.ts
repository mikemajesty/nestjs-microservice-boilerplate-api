import {
  CatsCreateInput,
  CatsCreateOutput,
  CatsGetByIDInput,
  CatsGetByIDOutput,
  CatsListInput,
  CatsListOutput,
  CatsUpdateInput,
  CatsUpdateOutput
} from './types';

export abstract class ICatsCreateAdapter {
  abstract execute(input: CatsCreateInput): Promise<CatsCreateOutput>;
}

export abstract class ICatsUpdateAdapter {
  abstract execute(input: CatsUpdateInput): Promise<CatsUpdateOutput>;
}

export abstract class ICatsGetByIDAdapter {
  abstract execute(input: CatsGetByIDInput): Promise<CatsGetByIDOutput>;
}

export abstract class ICatsListAdapter {
  abstract execute(input: CatsListInput): Promise<CatsListOutput>;
}
