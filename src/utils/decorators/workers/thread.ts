import { parentPort } from 'worker_threads'

parentPort?.on('message', async (data) => {
  try {
    const [fnCode, args] = data

    // Better async removal with regex
    const cleanFnCode = (fnCode as string).replace(/^async\s+/, '').trim()

    const fn = new Function(`return async function ${cleanFnCode}`)() as (...args: unknown[]) => Promise<unknown>
    const result = await fn(...args)

    parentPort?.postMessage({ success: result })
  } catch (error) {
    // Proper error serialization
    const serializedError = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Error'
    }

    parentPort?.postMessage({ error: serializedError })
  }
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  parentPort?.postMessage({
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    }
  })
  process.exit(1)
})

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason))
  parentPort?.postMessage({
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    }
  })
  process.exit(1)
})
