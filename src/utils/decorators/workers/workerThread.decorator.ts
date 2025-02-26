import { Worker } from 'worker_threads';

import { ApiInternalServerException, ApiTimeoutException } from '@/utils/exception';

export function RunInNewThread(timeout?: number) {
  return function (target: object, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      return new Promise((resolve, reject) => {
        const fnCode = originalMethod.toString();

        const worker = new Worker(`${__dirname}/worker.js`);

        worker.on('message', (result: unknown) => {
          resolve(result);
        });

        worker.on('error', (err: Error) => {
          reject(err);
        });

        worker.on('exit', (code: number) => {
          if (code !== 0) reject(new ApiInternalServerException(`worker stopped with exit code ${code}`));
        });

        worker.postMessage([fnCode, args]);

        let timeoutId: NodeJS.Timeout | null = null;
        if (timeout) {
          timeoutId = setTimeout(() => {
            const className = target.constructor.name;
            const methodName = key;
            const error = new ApiTimeoutException('worker execution timed out.');
            Object.assign(error, { context: `${className}/${methodName}` });
            reject(error);
            worker.terminate();
          }, timeout);
        }

        worker.on('message', () => {
          if (timeoutId) clearTimeout(timeoutId);
        });
        worker.on('exit', () => {
          if (timeoutId) clearTimeout(timeoutId);
        });
      });
    };

    return descriptor;
  };
}
