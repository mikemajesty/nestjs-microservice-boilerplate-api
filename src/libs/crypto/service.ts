import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { z } from 'zod';

import { ValidateSchema } from '@/common/decorators';

import { ICryptoAdapter } from './adapter';

const CryptoSchema = z.string().min(1).trim();

export type CreateHashInput = z.infer<typeof CryptoSchema>;

export type CreateHashOutput = string;

@Injectable()
export class CryptoService implements ICryptoAdapter {
  @ValidateSchema(CryptoSchema)
  createHash(input: CreateHashInput): CreateHashOutput {
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}
