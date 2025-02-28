import { red } from 'colorette';
import { Worker } from 'worker_threads';

import { ApiTimeoutException } from '@/utils/exception';

export function RunInNewThread(timeout?: number) {
  return function (target: object, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      const fnCode = originalMethod.toString();

      const worker = new Worker(`${__dirname}/thread.js`);

      let timeoutId: NodeJS.Timeout | null = null;

      worker.postMessage([fnCode, args]);

      if (timeout) {
        timeoutId = setTimeout(() => {
          const className = target.constructor.name;
          const methodName = key;
          const error = new ApiTimeoutException('worker execution timed out.', { timeout });
          Object.assign(error, { context: `${className}/${methodName}` });

          console.error(error);
          worker.terminate();
        }, timeout);
      }

      worker.on('message', (value: { error: Error; success: unknown }) => {
        if (timeoutId) clearTimeout(timeoutId);
        if (value.error) {
          return Promise.reject(value.error);
        }

        if (value.success) {
          return Promise.resolve(value.success);
        }
      });

      worker.on('error', (err: Error) => {
        if (timeoutId) clearTimeout(timeoutId);
        if (err.name === 'ReferenceError') {
          console.error(red('worker error '), err);
          return;
        }
        console.error(red('worker error '), err?.message ?? err);
      });

      worker.on('exit', (code: number) => {
        if (timeoutId) clearTimeout(timeoutId);
        if (code !== 0) {
          console.error(red(`worker stopped with exit code ${code}`));
        }
      });
    };

    return descriptor;
  };
}
