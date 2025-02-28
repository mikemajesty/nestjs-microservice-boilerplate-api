import { parentPort } from 'worker_threads';

parentPort?.on('message', async (data) => {
  try {
    const [fnCode, args] = data;

    const removeAsync = (fnCode as string).replace('async', '');

    const fn = new Function(`return async function ${removeAsync}`)();
    const result = await fn(...args);

    parentPort?.postMessage({ success: result });
  } catch (error) {
    parentPort?.postMessage({ error });
  }
});
