/**
 * C / C++ runtime via Wandbox API (https://wandbox.org).
 * Free, no API key required, CORS-enabled.
 * Requires an active internet connection.
 */

const WANDBOX_URL = 'https://wandbox.org/api/compile.json';

async function wandboxRun({ compiler, options, code, signal, outputCallback, errorCallback }) {
  let response;
  try {
    response = await fetch(WANDBOX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, compiler, options, stdin: '' }),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') return;
    errorCallback(
      `Network error: ${err.message}\n\nC/C++ compilation requires an internet connection (powered by Wandbox).`
    );
    return;
  }

  if (!response.ok) {
    let body = '';
    try { body = await response.text(); } catch (_) {}
    errorCallback(`Compiler service error (HTTP ${response.status})${body ? ': ' + body : ''}. Please try again.`);
    return;
  }

  let result;
  try {
    result = await response.json();
  } catch (_) {
    errorCallback('Invalid response from compiler service.');
    return;
  }

  // Compilation errors
  if (result.compiler_error) {
    errorCallback(result.compiler_error);
    return;
  }

  // Runtime output
  const stdout = result.program_output || '';
  const stderr = result.program_error || '';
  const exitCode = parseInt(result.status ?? '0', 10);

  if (stdout) outputCallback(stdout);
  if (stderr) errorCallback(stderr);
  if (!stdout && !stderr) {
    outputCallback(exitCode === 0 ? 'Program exited with no output.' : `Program exited with code ${exitCode}.`);
  }
}

export const runC = (code, outputCallback, errorCallback, signal) =>
  wandboxRun({ compiler: 'gcc-head-c', options: '-std=c11 -Wall', code, signal, outputCallback, errorCallback });

export const runCpp = (code, outputCallback, errorCallback, signal) =>
  wandboxRun({ compiler: 'gcc-head', options: '-std=c++17 -Wall', code, signal, outputCallback, errorCallback });
