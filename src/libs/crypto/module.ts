import { Module } from '@nestjs/common';

import { ICryptoAdapter } from './adapter';
import { CryptoService } from './service';

@Module({
  imports: [],
  providers: [
    {
      provide: ICryptoAdapter,
      useFactory: () => new CryptoService()
    }
  ],
  exports: [ICryptoAdapter]
})
export class CryptoLibModule {}
