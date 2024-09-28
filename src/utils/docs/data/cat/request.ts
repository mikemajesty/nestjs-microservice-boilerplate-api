import { CatCreateInput } from '@/core/cat/use-cases/cat-create';
import { CatUpdateInput } from '@/core/cat/use-cases/cat-update';

export const CatRequest = {
  create: { name: 'miau', breed: 'breed', age: 1 } as CatCreateInput,
  update: { name: 'miau', breed: 'breed', age: 1 } as CatUpdateInput
};
