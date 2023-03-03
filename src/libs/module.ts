import { Module } from '@nestjs/common';

import { TokenModule } from './auth';

@Module({
  imports: [TokenModule]
})
export class LibsModule {}
