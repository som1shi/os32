/**
 * Python runtime implementation using Skulpt
 * This module provides functions to execute Python code in the browser
 */


let skulptInstance = null;

/**
 * Initialize the Skulpt Python runtime
 * @param {Function} outputCallback - Function to call with output from Python code
 * @returns {Object} Configured Skulpt runtime
 * @throws {Error} If Skulpt is not loaded
 */
export const initializeSkulpt = (outputCallback) => {
  
  if (skulptInstance) {
    
    Sk.configure({ output: outputCallback });
    return skulptInstance;
  }

  if (typeof Sk === 'undefined') {
    throw new Error('Skulpt is not loaded. Make sure to include skulpt.min.js and skulpt-stdlib.js');
  }

  
  Sk.configure({
    output: outputCallback,
    read: builtinRead,
    __future__: Sk.python3,
    execLimit: 10000, 
    killableWhile: true, 
    killableFor: true,
    yieldLimit: 1000 
  });

  
  skulptInstance = Sk;
  return skulptInstance;
};

/**
 * Run Python code using Skulpt
 * @param {string} code - Python code to run
 * @param {Function} outputCallback - Function to handle output
 * @param {Function} errorCallback - Function to handle errors
 * @returns {Promise} Promise that resolves when execution is complete
 */
export const runPython = (code, outputCallback, errorCallback) => {
  if (!code || typeof code !== 'string') {
    const error = new Error('Invalid code input: code must be a non-empty string');
    errorCallback(error.message);
    return Promise.reject(error);
  }

  try {
    const Sk = initializeSkulpt(outputCallback);
    
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Execution timed out. Your code took too long to run.'));
      }, 15000); 
    });

    
    const executionPromise = Sk.misceval.asyncToPromise(() => {
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

    
    return Promise.race([executionPromise, timeoutPromise]);
  } catch (err) {
    errorCallback(`Runtime initialization error: ${err.message}`);
    return Promise.reject(err);
  }
};

/**
 * Format Python errors to be more user-friendly
 * @param {Error} err - The error object from Skulpt
 * @returns {string} Formatted error message
 */
const prettyError = (err) => {
  if (!err) return 'Unknown error';
  
  try {
    if (err.traceback) {
      const lines = [];
      for (let i = 0; i < err.traceback.length; i++) {
        const t = err.traceback[i];
        lines.push(`Line ${t.lineno}: ${t.line}`);
      }
      return `${err.toString()}\n\n${lines.join('\n')}`;
    } 
    
    
    if (err.toString().includes('maximum recursion')) {
      return 'Maximum recursion depth exceeded. You may have an infinite recursion in your code.';
    }
    
    
    return err.toString();
  } catch (formatError) {
    
    return 'An error occurred while running your code';
  }
};

/**
 * Handle file import requests from Skulpt
 * @param {string} filename - Name of the file to read
 * @returns {string} File contents
 * @throws {Error} If file is not found
 */
function builtinRead(filename) {
  if (
    Sk.builtinFiles === undefined ||
    Sk.builtinFiles["files"][filename] === undefined
  ) {
    throw new Error(`Module not found: ${filename}. Check your import statements.`);
  }
  return Sk.builtinFiles["files"][filename];
}

/**
 * Reset the Skulpt runtime instance
 * Useful to clear any state between executions
 */
export const resetSkulpt = () => {
  skulptInstance = null;
}; 