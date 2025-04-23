import { Module } from '@nestjs/common';

import { LoggerModule } from '@/infra/logger';

import { AlertController } from './controller';

@Module({
  imports: [LoggerModule],
  controllers: [AlertController],
  providers: [],
  exports: []
})
export class AlertModule {}
