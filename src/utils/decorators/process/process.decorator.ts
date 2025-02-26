import { ChildProcess, fork } from 'child_process';
import { red } from 'colorette';

import { ApiTimeoutException } from '@/utils/exception';

export function RunInNewProcess(timeout?: number) {
  return function (target: object, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      const child: ChildProcess = fork(`${__dirname}/process.js`);

      const functionCode = originalMethod.toString();
      child.send({ functionCode, args });

      let timeoutId: NodeJS.Timeout;

      if (timeout) {
        timeoutId = setTimeout(() => {
          child.kill();
          const error = new ApiTimeoutException('worker execution timed out.', { timeout });
          if (child?.send) child.send({ error });
        }, timeout);
      }

      child.on('message', () => {
        if (timeoutId) clearTimeout(timeoutId);
      });

      child.on('error', (error: Error) => {
        console.error(red('error in child process: '), error);
      });

      child.on('exit', (code: number) => {
        if (code !== 0) {
          console.error(red(`child process exited with code ${code}`));
        }
      });
    };

    return descriptor;
  };
}
