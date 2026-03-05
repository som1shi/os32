/**
 * JavaScript runtime — mirrors pythonRuntime.js using the same Worker/message protocol.
 * Worker loads from /jsWorker.js (public/).
 */

let currentWorker = null;

export const terminateJSExecution = () => {
  if (currentWorker) {
    currentWorker.terminate();
    currentWorker = null;
  }
};

/**
 * Run JavaScript code in an isolated Web Worker.
 * @param {string} code - JS source to execute
 * @param {Function} outputCallback - called with each stdout chunk
 * @param {Function} errorCallback  - called with a formatted error string
 * @returns {Promise<{success: boolean}>}
 */
export const runJavaScript = (code, outputCallback, errorCallback) => {
  if (!code || typeof code !== 'string') {
    errorCallback('Invalid code input: code must be a non-empty string');
    return Promise.reject(new Error('Invalid code'));
  }

  terminateJSExecution();

  return new Promise((resolve) => {
    let worker;
    try {
      worker = new Worker('/jsWorker.js');
      currentWorker = worker;
    } catch (err) {
      errorCallback(`Failed to start JavaScript runtime: ${err.message}`);
      resolve({ success: false });
      return;
    }

    const TIMEOUT_MS = 10000;
    const timeout = setTimeout(() => {
      worker.terminate();
      currentWorker = null;
      errorCallback('Execution timed out after 10 seconds.');
      resolve({ success: false, timedOut: true });
    }, TIMEOUT_MS);

    worker.onmessage = ({ data }) => {
      const { type, text, message } = data;
      if (type === 'output') {
        outputCallback(text);
      } else if (type === 'done') {
        clearTimeout(timeout);
        worker.terminate();
        currentWorker = null;
        resolve({ success: true });
      } else if (type === 'error') {
        clearTimeout(timeout);
        worker.terminate();
        currentWorker = null;
        errorCallback(message);
        resolve({ success: false });
      }
    };

    worker.onerror = (err) => {
      clearTimeout(timeout);
      worker.terminate();
      currentWorker = null;
      errorCallback(`Runtime error: ${err.message}`);
      resolve({ success: false });
    };

    worker.postMessage({ code });
  });
};
