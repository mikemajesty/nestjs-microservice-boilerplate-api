/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/decorators/process.md
 */
import { ChildProcess, fork } from 'child_process'
import { red } from 'colorette'

import { ApiTimeoutException } from '../../exception'

export function RunInNewProcess(timeout?: number) {
  return function (target: object, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      return new Promise((resolve, reject) => {
        const processFile = __filename.endsWith('.ts') ? `${__dirname}/process.ts` : `${__dirname}/process.js`

        const child: ChildProcess = __filename.endsWith('.ts')
          ? fork(processFile, [], {
            execArgv: ['-r', 'ts-node/register'],
            silent: false
          })
          : fork(processFile)
        let timeoutId: NodeJS.Timeout | null = null
        let isResolved = false

        const cleanup = () => {
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          if (!child.killed) {
            child.kill('SIGTERM')
          }
        }

        const resolveOnce = (value: unknown) => {
          if (!isResolved) {
            isResolved = true
            cleanup()
            resolve(value)
          }
        }

        const rejectOnce = (error: Error) => {
          if (!isResolved) {
            isResolved = true
            cleanup()
            reject(error)
          }
        }

        const functionCode = originalMethod.toString()
        child.send({ functionCode, args })

        if (timeout) {
          timeoutId = setTimeout(() => {
            const className = target.constructor.name
            const methodName = key
            const error = new ApiTimeoutException('Process execution timed out.', { timeout })
            Object.assign(error, { context: `${className}/${methodName}` })
            rejectOnce(error)
          }, timeout)
        }

        child.once('message', (message: { error?: unknown; success?: unknown }) => {
          if (message.error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorObj = message.error as any
            const error = new Error(errorObj.message || 'Process execution failed')
            if (errorObj.stack) {
              error.stack = errorObj.stack
            }
            rejectOnce(error)
          } else {
            resolveOnce(message.success)
          }
        })

        child.once('error', (error: Error) => {
          if (error.name === 'ReferenceError') {
            console.error(
              red('Cannot use custom errors or objects as response - they do not exist in the new process.'),
              error.message
            )
            rejectOnce(new Error('Reference error in child process: ' + error.message))
          } else {
            rejectOnce(error)
          }
        })

        child.once('exit', (code: number, signal: string) => {
          if (code !== 0 && !isResolved) {
            rejectOnce(new Error(`Child process exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`))
          }
        })

        child.once('disconnect', () => {
          if (!isResolved) {
            rejectOnce(new Error('Child process disconnected unexpectedly'))
          }
        })
      })
    }

    return descriptor
  }
}
