import { CatsCreateInput } from '@/core/cat/use-cases/cats-create';
import { CatsUpdateInput } from '@/core/cat/use-cases/cats-update';

export const CatsRequest = {
  create: { name: 'miau', breed: 'breed', age: 1 } as CatsCreateInput,
  update: { name: 'miau', breed: 'breed', age: 1 } as CatsUpdateInput
};
