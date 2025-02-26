// process.js
process.on('message', async ({ functionCode, args }) => {
  try {
    const removeAsync = (functionCode as string).replace('async', '');

    const fn = new Function(`return async function ${removeAsync}`)();

    const result = (await fn(...args)) || [];
    if (process?.send) {
      process?.send(result);
    }
  } catch (error) {
    if (process?.send) {
      process?.send(error);
    }
  } finally {
    process.exit();
  }
});
