/**
 * Initialize the Skulpt Python runtime
 * @param {Function} outputCallback - Function to call with output from Python code
 * @returns {Object} Configured Skulpt runtime
 */
export const initializeSkulpt = (outputCallback) => {
  if (typeof Sk === 'undefined') {
    console.error('Skulpt is not loaded');
    return null;
  }

  Sk.configure({
    output: outputCallback,
    read: builtinRead,
    __future__: Sk.python3,
    execLimit: 5000,
  });

  return Sk;
};

/**
 * Run Python code using Skulpt
 * @param {string} code - Python code to run
 * @param {Function} outputCallback - Function to handle output
 * @param {Function} errorCallback - Function to handle errors
 * @returns {Promise} Promise that resolves when execution is complete
 */
export const runPython = (code, outputCallback, errorCallback) => {
  const Sk = initializeSkulpt(outputCallback);
  if (!Sk) {
    errorCallback('Python runtime not initialized');
    return Promise.reject('Python runtime not initialized');
  }

  return Sk.misceval.asyncToPromise(() => {
    return Sk.importMainWithBody("<stdin>", false, code, true);
  }).then(
    (mod) => {
      return { success: true, module: mod };
    },
    (err) => {
      errorCallback(prettyError(err));
      return { success: false, error: err };
    }
  );
};

/**
 * Format Python errors to be more user-friendly
 * @param {Error} err - The error object from Skulpt
 * @returns {string} Formatted error message
 */
const prettyError = (err) => {
  if (err.traceback) {
    const lines = [];
    for (let i = 0; i < err.traceback.length; i++) {
      const t = err.traceback[i];
      lines.push(`Line ${t.lineno}: ${t.line}`);
    }
    return `${err.toString()}\n\n${lines.join('\n')}`;
  } else {
    return err.toString();
  }
};

/**
 * Handle file import requests from Skulpt
 * @param {string} filename - Name of the file to read
 * @returns {string} File contents
 */
function builtinRead(filename) {
  if (
    Sk.builtinFiles === undefined ||
    Sk.builtinFiles["files"][filename] === undefined
  ) {
    throw new Error(`File not found: ${filename}`);
  }
  return Sk.builtinFiles["files"][filename];
} 