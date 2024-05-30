import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { IEventAdapter } from './adapter';

export type EventOutput = boolean;

@Injectable()
export class EventService implements IEventAdapter {
  constructor(private eventEmitter: EventEmitter2) {}

  emit(event: string, payload: unknown): EventOutput {
    const eventEmmiter = this.eventEmitter.emit(event, payload);

    return eventEmmiter;
  }
}
