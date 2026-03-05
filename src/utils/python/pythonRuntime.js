/**
 * Python runtime — uses a Web Worker so execution never blocks the UI.
 * The worker loads Skulpt from public/ via importScripts.
 */

let currentWorker = null;

/**
 * Statically detect obvious infinite loops before execution.
 * Checks every `while True/1:` block for break/return/raise/sys.exit.
 * Returns { safe: true } or { safe: false, line, message }.
 */
export const detectInfiniteLoop = (code) => {
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const stripped = raw.trimStart();

    if (stripped === '' || stripped.startsWith('#')) continue;

    if (/^while\s*\(?\s*(True|1)\s*\)?\s*:/.test(stripped)) {
      const loopIndent = raw.length - stripped.length;
      let hasExit = false;

      for (let j = i + 1; j < lines.length; j++) {
        const bodyRaw = lines[j];
        const bodyStripped = bodyRaw.trimStart();

        if (bodyStripped === '' || bodyStripped.startsWith('#')) continue;

        const bodyIndent = bodyRaw.length - bodyStripped.length;
        if (bodyIndent <= loopIndent) break;

        if (/^(break|return|raise|sys\.exit)\b/.test(bodyStripped)) {
          hasExit = true;
          break;
        }
      }

      if (!hasExit) {
        return {
          safe: false,
          line: i + 1,
          message: `Infinite loop detected on line ${i + 1}: 'while True' has no break, return, or raise.`,
        };
      }
    }
  }

  return { safe: true };
};

/**
 * Terminate any currently running Python execution immediately.
 */
export const terminateExecution = () => {
  if (currentWorker) {
    currentWorker.terminate();
    currentWorker = null;
  }
};

/**
 * Run Python code in an isolated Web Worker.
 * @param {string} code - Python source to execute
 * @param {Function} outputCallback - called with each chunk of stdout
 * @param {Function} errorCallback - called with a formatted error string
 * @returns {Promise<{success: boolean}>}
 */
export const runPython = (code, outputCallback, errorCallback) => {
  if (!code || typeof code !== 'string') {
    const msg = 'Invalid code input: code must be a non-empty string';
    errorCallback(msg);
    return Promise.reject(new Error(msg));
  }

  terminateExecution();

  return new Promise((resolve) => {
    let worker;
    try {
      worker = new Worker('/pythonWorker.js');
      currentWorker = worker;
    } catch (err) {
      errorCallback(`Failed to start Python runtime: ${err.message}`);
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

/** No-op kept for API compatibility — worker approach is always fresh. */
export const resetSkulpt = () => { };
