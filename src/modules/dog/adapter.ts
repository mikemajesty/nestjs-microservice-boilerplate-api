import {
  DogCreateInput,
  DogCreateOutput,
  DogDeleteInput,
  DogDeleteOutput,
  DogGetByIDInput,
  DogGetByIDOutput,
  DogListInput,
  DogListOutput,
  DogUpdateInput,
  DogUpdateOutput
} from './types';

export abstract class IDogCreateAdapter {
  abstract execute(input: DogCreateInput): Promise<DogCreateOutput>;
}

export abstract class IDogUpdateAdapter {
  abstract execute(input: DogUpdateInput): Promise<DogUpdateOutput>;
}

export abstract class IDogGetByIDAdapter {
  abstract execute(input: DogGetByIDInput): Promise<DogGetByIDOutput>;
}

export abstract class IDogListAdapter {
  abstract execute(input: DogListInput): Promise<DogListOutput>;
}

export abstract class IDogDeleteAdapter {
  abstract execute(input: DogDeleteInput): Promise<DogDeleteOutput>;
}
