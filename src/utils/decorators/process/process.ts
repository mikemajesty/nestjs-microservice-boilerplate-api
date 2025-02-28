process.on('message', async ({ functionCode, args }) => {
  try {
    const removeAsync = (functionCode as string).replace('async', '').trim();

    const fn = new Function(`return async function ${removeAsync}`)();

    const result = (await fn(...args)) || [];
    if (process?.send) {
      process?.send({ success: result });
    }
  } catch (error) {
    if (process?.send) {
      const newError = { message: (error as Error)?.message, stack: (error as Error).stack };
      process?.send({ error: newError });
    }
  } finally {
    process.exit();
  }
});

process.on('uncaughtException', (error) => {
  if (process.send) {
    process.send({ error: { message: error.message, stack: error.stack } });
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  let errorMessage = String(reason);
  let errorStack = '';

  if (reason instanceof Error) {
    errorMessage = reason.message;
    errorStack = reason.stack || '';
  }

  if (process.send) {
    process.send({ error: { message: errorMessage, stack: errorStack } });
  }

  process.exit(1);
});
