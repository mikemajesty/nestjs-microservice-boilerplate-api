import { EventOutput } from './service';
import { EventNameEnum } from './types';

export abstract class IEventAdapter {
  abstract emit(event: EventNameEnum, payload: unknown): EventOutput;
}
