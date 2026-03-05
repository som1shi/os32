/**
 * Python Web Worker using Skulpt
 * Runs Python code off the main thread so the UI never freezes.
 * Can be terminated instantly by the parent via worker.terminate().
 */
importScripts('/skulpt.min.js', '/skulpt-stdlib.js');

const MAX_OUTPUT_CHARS = 10000;
let outputAccum = 0;
let truncated = false;

function builtinRead(filename) {
  if (
    Sk.builtinFiles === undefined ||
    Sk.builtinFiles['files'][filename] === undefined
  ) {
    throw new Error(`Module not found: ${filename}. Check your import statements.`);
  }
  return Sk.builtinFiles['files'][filename];
}

function prettyError(err) {
  if (!err) return 'Unknown error';
  try {
    if (err.traceback && err.traceback.length > 0) {
      const lines = err.traceback.map((t) => `Line ${t.lineno}: ${t.line}`);
      return `${err.toString()}\n\n${lines.join('\n')}`;
    }
    if (err.toString().includes('maximum recursion')) {
      return 'Maximum recursion depth exceeded. You may have an infinite recursion in your code.';
    }
    return err.toString();
  } catch (_) {
    return 'An error occurred while running your code';
  }
}

self.onmessage = (e) => {
  const { code } = e.data;
  outputAccum = 0;
  truncated = false;

  Sk.configure({
    output: (text) => {
      if (truncated) return;
      outputAccum += text.length;
      if (outputAccum > MAX_OUTPUT_CHARS) {
        truncated = true;
        self.postMessage({
          type: 'output',
          text: '\n[Output truncated: exceeded 10 000 character limit]\n',
        });
        return;
      }
      self.postMessage({ type: 'output', text });
    },
    read: builtinRead,
    __future__: Sk.python3,
    execLimit: 50000,
    killableWhile: true,
    killableFor: true,
    yieldLimit: 1000,
  });

  Sk.misceval.asyncToPromise(() =>
    Sk.importMainWithBody('<stdin>', false, code, true)
  ).then(
    () => self.postMessage({ type: 'done' }),
    (err) => self.postMessage({ type: 'error', message: prettyError(err) })
  );
};
