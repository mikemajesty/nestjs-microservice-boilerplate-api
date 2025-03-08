import { performance } from 'node:perf_hooks';

import { yellow } from 'colorette';

import { LoggerService } from '@/infra/logger';

export function LogExecutionTime(target: object, propertyKey: string, descriptor: PropertyDescriptor): void {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: unknown[]) {
    const start = performance.now();
    const result = await originalMethod.apply(this, args);
    const className = target.constructor.name;
    const methodName = propertyKey;
    const end = performance.now();
    LoggerService.log(yellow(`Function ${className}/${methodName} took ${(end - start).toFixed(3)}ms to execute.`));
    return result;
  };
}
