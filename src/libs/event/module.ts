import { Module } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';

import { IEventAdapter } from './adapter';
import { EventService } from './service';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    {
      provide: IEventAdapter,
      useFactory: (event: EventEmitter2) => new EventService(event),
      inject: [EventEmitter2]
    }
  ],
  exports: [IEventAdapter]
})
export class EventLibModule {}
