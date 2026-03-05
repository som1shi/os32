/**
 * JavaScript Web Worker — runs user JS code off the main thread.
 * Follows the same message protocol as pythonWorker.js:
 *   receive: { code }
 *   send:    { type: 'output'|'error'|'done', text?, message? }
 */

const MAX_OUTPUT_CHARS = 10000;
let outputAccum = 0;
let truncated = false;

function safeStr(val) {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    try { return JSON.stringify(val, null, 2); } catch (_) { return String(val); }
  }
  return String(val);
}

function emit(text) {
  if (truncated) return;
  outputAccum += text.length;
  if (outputAccum > MAX_OUTPUT_CHARS) {
    truncated = true;
    self.postMessage({ type: 'output', text: '\n[Output truncated: exceeded 10 000 character limit]\n' });
    return;
  }
  self.postMessage({ type: 'output', text });
}

// Sandboxed console that routes to the parent page
const sandboxConsole = {
  log:   (...a) => emit(a.map(safeStr).join(' ') + '\n'),
  error: (...a) => emit('Error: ' + a.map(safeStr).join(' ') + '\n'),
  warn:  (...a) => emit('Warning: ' + a.map(safeStr).join(' ') + '\n'),
  info:  (...a) => emit(a.map(safeStr).join(' ') + '\n'),
  dir:   (obj)  => emit(safeStr(obj) + '\n'),
  table: (data) => emit(safeStr(data) + '\n'),
};

// Convert browser dialogs to printed output so they don't block the worker
self.alert   = (msg) => emit(`[alert] ${msg}\n`);
self.prompt  = (msg) => { emit(`[prompt] ${msg}\n`); return ''; };
self.confirm = (msg) => { emit(`[confirm] ${msg}\n`); return false; };

self.onmessage = (e) => {
  const { code } = e.data;
  outputAccum = 0;
  truncated = false;

  try {
    // Inject sandboxed console as the only parameter, shadowing any global.
    // This means bare `console.log()` in user code routes through sandboxConsole.
    const fn = new Function('console', code);
    const result = fn(sandboxConsole);

    // Support async/await at the top level
    if (result && typeof result.then === 'function') {
      result.then(
        ()    => self.postMessage({ type: 'done' }),
        (err) => self.postMessage({ type: 'error', message: String(err) })
      );
    } else {
      self.postMessage({ type: 'done' });
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: err.toString() });
  }
};
