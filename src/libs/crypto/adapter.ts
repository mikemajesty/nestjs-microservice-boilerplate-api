import { CreateHashInput, CreateHashOutput } from './service';

export abstract class ICryptoAdapter {
  abstract createHash(input: CreateHashInput): CreateHashOutput;
}
