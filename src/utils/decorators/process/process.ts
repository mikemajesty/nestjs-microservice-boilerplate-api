process.on('message', async ({ functionCode, args }) => {
  try {
    const cleanFnCode = (functionCode as string).replace(/^async\s+/, '').trim()

    const fn = new Function(`return async function ${cleanFnCode}`)() as (...args: unknown[]) => Promise<unknown>

    const result = await fn(...args)

    if (process?.send) {
      process.send({ success: result })
    }
  } catch (error) {
    if (process?.send) {
      const serializedError = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Error'
      }
      process.send({ error: serializedError })
    }
  } finally {
    process.exit(0)
  }
})

process.on('uncaughtException', (error) => {
  if (process.send) {
    process.send({
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    })
  }
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason))

  if (process.send) {
    process.send({
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    })
  }

  process.exit(1)
})
