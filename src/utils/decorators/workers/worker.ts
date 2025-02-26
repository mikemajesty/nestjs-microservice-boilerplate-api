import { parentPort } from 'worker_threads';

parentPort?.on('message', (data) => {
  try {
    const [fnCode, args] = data;

    const removeAsync = (fnCode as string).replace('async', '');

    const fn = new Function(`return async function ${removeAsync}`)();
    const result = fn(...args);

    parentPort?.postMessage(result);
  } catch (error) {
    parentPort?.postMessage(error);
  }
});
