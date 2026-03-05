import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../firebase/AuthContext';
import { createFile, updateFile, getFilesByName } from '../../firebase/fileService';
import { runPython, detectInfiniteLoop, terminateExecution } from '../../utils/python/pythonRuntime';
import { runJavaScript, terminateJSExecution } from '../../utils/languages/jsRuntime';
import { runC, runCpp } from '../../utils/languages/cRuntime';
import { pythonToPYG, PYGToPython } from '../../utils/pyg/translator';
import { PYTHON_KEYWORDS, PYG_KEYWORDS } from '../../utils/pyg/mappings';
import { JS_KEYWORDS, C_KEYWORDS, CPP_KEYWORDS } from '../../utils/languages/keywords';
import FileExplorer from '../FileExplorer/FileExplorer';
import AIPanel from './AIPanel';
import AISettings from './AISettings';
import aiService from '../../services/aiService';
import './CodeEditor.css';

const DEFAULT_CODE = {
  python: `# Welcome to CodeEditor\n# Write your Python code here\nprint("Hello, world!")\n`,
  pyg: `# Welcome to CodeEditor\nyap("Hello, world!")\n`,
  javascript: `// Welcome to CodeEditor\nconsole.log("Hello, world!");\n`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, world!\\n");\n    return 0;\n}\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, world!" << endl;\n    return 0;\n}\n`,
};

const EXTENSIONS = { python: '.py', pyg: '.pyg', javascript: '.js', c: '.c', cpp: '.cpp' };

function stripKnownExtension(name) {
  for (const ext of Object.values(EXTENSIONS)) {
    if (name.endsWith(ext)) return name.slice(0, -ext.length);
  }
  return name;
}

function detectMode(filename) {
  if (!filename) return 'python';
  if (filename.endsWith('.pyg')) return 'pyg';
  if (filename.endsWith('.js')) return 'javascript';
  if (filename.endsWith('.c')) return 'c';
  if (filename.endsWith('.cpp') || filename.endsWith('.cc') || filename.endsWith('.cxx')) return 'cpp';
  return 'python';
}

// Which comment token to look for per mode
function commentToken(mode) {
  return (mode === 'python' || mode === 'pyg') ? '#' : '//';
}

// CSS class prefix per mode
function classPfx(mode) {
  if (mode === 'python') return 'python';
  if (mode === 'pyg') return 'pyg';
  return 'lang'; // shared for js / c / cpp
}

// Keyword list per mode
function keywordsFor(mode) {
  if (mode === 'python') return PYTHON_KEYWORDS;
  if (mode === 'pyg') return PYG_KEYWORDS;
  if (mode === 'javascript') return JS_KEYWORDS;
  if (mode === 'c') return C_KEYWORDS;
  if (mode === 'cpp') return CPP_KEYWORDS;
  return [];
}

const CodeEditor = ({ file, onClose, setWindowTitle }) => {
  const initialMode = detectMode(file?.name);
  const [code, setCode] = useState(file?.content || DEFAULT_CODE[initialMode]);
  const [output, setOutput] = useState('');
  const [fileName, setFileName] = useState(file?.name || `Untitled${EXTENSIONS[initialMode]}`);
  const [mode, setMode] = useState(initialMode);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const { currentUser } = useAuth();

  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [inlineCompletion, setInlineCompletion] = useState(null);
  const [isCompletionLoading, setIsCompletionLoading] = useState(false);

  const editorRef = useRef(null);
  const isInitialMount = useRef(true);
  const highlightTimeoutRef = useRef(null);
  const justPressedKeyRef = useRef(false);
  const keyTimeoutRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const completionAbortRef = useRef(null);
  const inlineCompletionRef = useRef(null);
  const cAbortRef = useRef(null);

  useEffect(() => { inlineCompletionRef.current = inlineCompletion; }, [inlineCompletion]);

  const stripHtml = useCallback((html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }, []);

  const debounceCodeUpdate = useCallback((newCode) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setCode(newCode);
    }, 300);
  }, []);

  const cleanupTimeouts = useCallback(() => {
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    if (keyTimeoutRef.current) clearTimeout(keyTimeoutRef.current);
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (setWindowTitle) {
      setWindowTitle(`CodeEditor - ${fileName}`);
    }
  }, [fileName, setWindowTitle]);

  useEffect(() => {
    if (editorRef.current && code) {
      const cleanCode = stripHtml(code);
      setCode(cleanCode);
      editorRef.current.innerText = cleanCode;
    }

    return () => {
      cleanupTimeouts();
      terminateExecution();
      terminateJSExecution();
      cAbortRef.current?.abort();
      completionAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }

    if (justPressedKeyRef.current) {
      return;
    }

    highlightTimeoutRef.current = setTimeout(() => {
      if (editorRef.current) {
        try {
          const selection = window.getSelection();
          let selectionStart = 0;
          let selectionEnd = 0;

          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const preSelectionRange = range.cloneRange();
            preSelectionRange.selectNodeContents(editorRef.current);
            preSelectionRange.setEnd(range.startContainer, range.startOffset);
            selectionStart = preSelectionRange.toString().length;

            preSelectionRange.setEnd(range.endContainer, range.endOffset);
            selectionEnd = preSelectionRange.toString().length;
          }

          const text = editorRef.current.innerText;

          const tempContainer = document.createElement('div');

          const lines = text.split('\n');
          lines.forEach(line => {
            if (line.trim() === '') {
              tempContainer.appendChild(document.createElement('br'));
              return;
            }

            const lineDiv = document.createElement('div');
            lineDiv.style.minHeight = '1em';

            // C/C++: lines starting with '#' are preprocessor directives, not comments
            const trimmed = line.trimStart();
            if ((mode === 'c' || mode === 'cpp') && trimmed.startsWith('#')) {
              const span = document.createElement('span');
              span.textContent = line;
              span.className = 'lang-preprocessor';
              lineDiv.appendChild(span);
            } else {
              const token = commentToken(mode);
              const commentIndex = line.indexOf(token);

              if (commentIndex >= 0) {
                if (commentIndex > 0) {
                  appendHighlightedText(lineDiv, line.substring(0, commentIndex), mode);
                }
                const commentSpan = document.createElement('span');
                commentSpan.textContent = line.substring(commentIndex);
                commentSpan.className = `${classPfx(mode)}-comment`;
                lineDiv.appendChild(commentSpan);
              } else {
                appendHighlightedText(lineDiv, line, mode);
              }
            }

            tempContainer.appendChild(lineDiv);
          });

          editorRef.current.innerHTML = '';
          editorRef.current.appendChild(tempContainer);

          if (selectionStart !== undefined) {
            restoreCursorPosition(editorRef.current, selectionStart, selectionEnd);
          }
        } catch (e) {
          console.error('Error highlighting code:', e);
        }
      }
    }, 300);

    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [code, mode]);

  const restoreCursorPosition = (containerEl, selectionStart, selectionEnd) => {
    const walker = document.createTreeWalker(
      containerEl,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let currentNode = walker.nextNode();
    let charCount = 0;
    let startNode, startOffset, endNode, endOffset;

    while (currentNode) {
      const nodeLength = currentNode.nodeValue.length;

      if (charCount <= selectionStart && selectionStart <= charCount + nodeLength) {
        startNode = currentNode;
        startOffset = selectionStart - charCount;
      }

      if (charCount <= selectionEnd && selectionEnd <= charCount + nodeLength) {
        endNode = currentNode;
        endOffset = selectionEnd - charCount;
        break;
      }

      charCount += nodeLength;
      currentNode = walker.nextNode();
    }

    if (!startNode) {
      const firstTextNode = containerEl.querySelector('div')?.firstChild;
      if (firstTextNode && firstTextNode.nodeType === Node.TEXT_NODE) {
        startNode = firstTextNode;
        startOffset = 0;
      }
    }

    if (!endNode) {
      endNode = startNode;
      endOffset = startOffset;
    }

    if (startNode && endNode) {
      const selection = window.getSelection();
      const range = document.createRange();

      try {
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        console.error('Failed to restore selection:', e);
      }
    }
  };

  const appendHighlightedText = (container, text, highlightMode) => {
    const stringRegex = /(['"])(?:(?!\1|\\).|\\.)*\1/g;
    let match;
    let lastIndex = 0;

    stringRegex.lastIndex = 0;
    while ((match = stringRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        processWordByWord(container, beforeText, highlightMode);
      }


      const stringSpan = document.createElement('span');
      stringSpan.textContent = match[0];
      stringSpan.className = `${classPfx(highlightMode)}-string`;
      container.appendChild(stringSpan);

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      processWordByWord(container, text.substring(lastIndex), highlightMode);
    }
  };


  const processWordByWord = (container, text, highlightMode) => {

    if (highlightMode === 'pyg') {
      const multiWordKeywords = [
        'lock in', 'its giving', 'chat is this real', 'only in ohio', 'yo chat',
        'let him cook', 'just put the fries in the bag bro', 'spit on that thang',
        'fanum tax', 'sigma twin', 'beta twin'
      ];

      for (const keyword of multiWordKeywords) {
        const index = text.indexOf(keyword);
        if (index !== -1) {

          if (index > 0) {
            processWordByWord(container, text.substring(0, index), highlightMode);
          }


          const span = document.createElement('span');
          span.textContent = keyword;
          span.className = 'pyg-keyword';
          container.appendChild(span);


          if (index + keyword.length < text.length) {
            processWordByWord(container, text.substring(index + keyword.length), highlightMode);
          }

          return;
        }
      }
    }


    const keywords = keywordsFor(highlightMode);
    const pfx = classPfx(highlightMode);
    const wordRegex = /([a-zA-Z_]\w*)|([0-9]+(?:\.[0-9]+)?)|(\s+)|([^\w\s])/g;

    let match;
    while ((match = wordRegex.exec(text)) !== null) {
      const [fullMatch, word, number, whitespace, punctuation] = match;

      if (word) {
        const isFunction = text.substring(match.index + word.length).trim().startsWith('(');
        if (isFunction) {
          const span = document.createElement('span');
          span.textContent = word;
          span.className = `${pfx}-function`;
          container.appendChild(span);
        } else if (keywords.includes(word)) {
          const span = document.createElement('span');
          span.textContent = word;
          span.className = `${pfx}-keyword`;
          container.appendChild(span);
        } else {
          container.appendChild(document.createTextNode(word));
        }
      } else if (number) {
        const span = document.createElement('span');
        span.textContent = number;
        span.className = `${pfx}-number`;
        container.appendChild(span);
      } else if (whitespace || punctuation) {
        container.appendChild(document.createTextNode(fullMatch));
      }
    }
  };

  const triggerInlineCompletion = useCallback(async () => {
    if (isCompletionLoading) return;
    if (!editorRef.current) return;

    // Abort any previous request
    completionAbortRef.current?.abort();
    const controller = new AbortController();
    completionAbortRef.current = controller;

    // Get cursor offset via TreeWalker
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);

    const preRange = range.cloneRange();
    preRange.selectNodeContents(editorRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);
    const cursorOffset = preRange.toString().length;

    const fullText = editorRef.current.innerText;
    const prefix = fullText.slice(0, cursorOffset);
    const suffix = fullText.slice(cursorOffset);

    // Get pixel position for tooltip
    const rangeBounds = range.getBoundingClientRect();
    const editorBounds = editorRef.current.getBoundingClientRect();
    const top = rangeBounds.bottom - editorBounds.top + editorRef.current.scrollTop + 2;
    const left = rangeBounds.left - editorBounds.left;

    setIsCompletionLoading(true);
    setInlineCompletion(null);

    try {
      const result = await aiService.getCompletion({ prefix, suffix, language: mode }, controller.signal);
      if (result && !controller.signal.aborted) {
        setInlineCompletion({ text: result, position: { top, left } });
      }
    } catch {
      // aborted or error — silent
    } finally {
      setIsCompletionLoading(false);
    }
  }, [isCompletionLoading, mode]);

  const acceptInlineCompletion = useCallback(() => {
    if (!inlineCompletion) return;
    document.execCommand('insertText', false, inlineCompletion.text);
    setCode(editorRef.current.innerText);
    setInlineCompletion(null);
  }, [inlineCompletion]);


  const handleContentChange = useCallback((e) => {
    if (inlineCompletionRef.current) setInlineCompletion(null);

    justPressedKeyRef.current = false;


    const plainText = e.target.innerText;
    debounceCodeUpdate(plainText);
  }, [debounceCodeUpdate]);


  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);


  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      triggerInlineCompletion();
      return;
    }

    if (e.key === 'Tab' && inlineCompletion) {
      e.preventDefault();
      acceptInlineCompletion();
      return;
    }

    if (e.key === 'Escape' && inlineCompletion) {
      setInlineCompletion(null);
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();

      const selection = window.getSelection();
      if (!selection.rangeCount) return;


      document.execCommand('insertText', false, '  ');


      justPressedKeyRef.current = true;


      const newText = editorRef.current.innerText;
      setCode(newText);


      if (keyTimeoutRef.current) {
        clearTimeout(keyTimeoutRef.current);
      }


      keyTimeoutRef.current = setTimeout(() => {
        justPressedKeyRef.current = false;
      }, 800);

      return;
    }


    if (e.key === 'Enter') {
      e.preventDefault();

      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      const range = selection.getRangeAt(0);


      let currentLineInfo = getCurrentLineInfo(editorRef.current, range);


      document.execCommand('insertText', false, '\n');


      if (currentLineInfo.indentation) {
        document.execCommand('insertText', false, currentLineInfo.indentation);
      }


      justPressedKeyRef.current = true;


      const newText = editorRef.current.innerText;
      setCode(newText);


      if (keyTimeoutRef.current) {
        clearTimeout(keyTimeoutRef.current);
      }


      keyTimeoutRef.current = setTimeout(() => {
        justPressedKeyRef.current = false;
      }, 800);
    }
  }, [inlineCompletion, triggerInlineCompletion, acceptInlineCompletion]);


  const getCurrentLineInfo = useCallback((editor, range) => {
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(editor);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const preCaretText = preSelectionRange.toString();


    const lastNewlineIndex = preCaretText.lastIndexOf('\n');
    const currentLineStart = lastNewlineIndex === -1 ? 0 : lastNewlineIndex + 1;
    const currentLineText = preCaretText.substring(currentLineStart);


    const indentMatch = currentLineText.match(/^(\s+)/);
    const indentation = indentMatch ? indentMatch[1] : '';

    return { lineText: currentLineText, indentation };
  }, []);


  const toggleMode = useCallback(async () => {
    if (mode === 'python') {
      try {

        const selection = window.getSelection();
        let selectionStart = 0;

        if (selection.rangeCount > 0 && editorRef.current) {
          const range = selection.getRangeAt(0);
          const preSelectionRange = range.cloneRange();
          preSelectionRange.selectNodeContents(editorRef.current);
          preSelectionRange.setEnd(range.startContainer, range.startOffset);
          selectionStart = preSelectionRange.toString().length;
        }


        const plainText = editorRef.current ? stripHtml(editorRef.current.innerText) : stripHtml(code);
        const pygCode = pythonToPYG(plainText);

        setCode(pygCode);
        setMode('pyg');


        if (fileName.endsWith('.py')) {
          setFileName(fileName.replace('.py', '.pyg'));
        }


        if (editorRef.current) {
          editorRef.current.innerText = pygCode;


          setTimeout(() => {
            if (editorRef.current) {
              const percentPosition = plainText.length > 0 ? selectionStart / plainText.length : 0;
              const newPosition = Math.min(Math.round(percentPosition * pygCode.length), pygCode.length);
              restoreCursorPosition(editorRef.current, newPosition, newPosition);
            }
          }, 10);
        }
      } catch (error) {
        setOutput(`Error converting to PYG: ${error.message}`);
        setHasErrors(true);
      }
    } else {
      try {

        const selection = window.getSelection();
        let selectionStart = 0;

        if (selection.rangeCount > 0 && editorRef.current) {
          const range = selection.getRangeAt(0);
          const preSelectionRange = range.cloneRange();
          preSelectionRange.selectNodeContents(editorRef.current);
          preSelectionRange.setEnd(range.startContainer, range.startOffset);
          selectionStart = preSelectionRange.toString().length;
        }


        const plainText = editorRef.current ? stripHtml(editorRef.current.innerText) : stripHtml(code);
        const pythonCode = PYGToPython(plainText);

        setCode(pythonCode);
        setMode('python');


        if (fileName.endsWith('.pyg')) {
          setFileName(fileName.replace('.pyg', '.py'));
        }


        if (editorRef.current) {
          editorRef.current.innerText = pythonCode;


          setTimeout(() => {
            if (editorRef.current) {
              const percentPosition = plainText.length > 0 ? selectionStart / plainText.length : 0;
              const newPosition = Math.min(Math.round(percentPosition * pythonCode.length), pythonCode.length);
              restoreCursorPosition(editorRef.current, newPosition, newPosition);
            }
          }, 10);
        }
      } catch (error) {
        setOutput(`Error converting to Python: ${error.message}`);
        setHasErrors(true);
      }
    }
  }, [code, mode, fileName, stripHtml]);

  // Switch language mode: fixes filename extension, swaps starter code if untouched, updates title.
  const switchLanguage = useCallback((newMode) => {
    if (newMode === mode) return;

    // python↔pyg: the translator handles code conversion + filename + mode
    if ((mode === 'python' && newMode === 'pyg') || (mode === 'pyg' && newMode === 'python')) {
      toggleMode();
      return;
    }

    // Fix filename — strip any existing known extension, then add the correct one
    const base = stripKnownExtension(fileName);
    const newFileName = `${base}${EXTENSIONS[newMode]}`;
    setFileName(newFileName);

    // Swap starter code only when the editor still shows the default for the old language
    if (code.trim() === DEFAULT_CODE[mode].trim()) {
      const newDefault = DEFAULT_CODE[newMode];
      setCode(newDefault);
      if (editorRef.current) {
        editorRef.current.innerText = newDefault;
      }
    }

    setMode(newMode);
  }, [mode, fileName, code, toggleMode]);


  const runCode = useCallback(async () => {
    if (!code.trim()) {
      setOutput('No code to run');
      setHasErrors(true);
      return;
    }

    setIsRunning(true);
    setHasErrors(false);
    let outputText = '';
    let hadError = false;

    const appendOutput = (text) => {
      outputText += text;
      setOutput(outputText.trimEnd());
    };
    const onError = (error) => {
      hadError = true;
      appendOutput(error);
      setHasErrors(true);
    };

    try {
      if (mode === 'python' || mode === 'pyg') {
        const codeToRun = mode === 'pyg' ? PYGToPython(code) : code;
        const loopCheck = detectInfiniteLoop(codeToRun);
        if (!loopCheck.safe) {
          setOutput(`Execution blocked: ${loopCheck.message}\n\nAdd a break, return, or raise to exit the loop.`);
          setHasErrors(true);
          setIsRunning(false);
          return;
        }
        setOutput('Running...');
        await runPython(codeToRun, appendOutput, (err) => onError(`Error: ${err}`));

      } else if (mode === 'javascript') {
        setOutput('Running...');
        await runJavaScript(code, appendOutput, onError);

      } else if (mode === 'c' || mode === 'cpp') {
        setOutput('Compiling...');
        cAbortRef.current = new AbortController();
        const runner = mode === 'c' ? runC : runCpp;
        await runner(code, appendOutput, onError, cAbortRef.current.signal);
      }

      if (!outputText.trim() && !hadError) {
        setOutput('Code executed successfully with no output.');
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
      setHasErrors(true);
    } finally {
      setIsRunning(false);
    }
  }, [code, mode]);

  const stopCode = useCallback(() => {
    terminateExecution();
    terminateJSExecution();
    cAbortRef.current?.abort();
    setOutput((prev) => (prev ? prev + '\n\n[Execution stopped by user]' : '[Execution stopped by user]'));
    setIsRunning(false);
  }, []);


  const saveFile = useCallback(async (showDialog = false) => {
    if (showDialog) {
      setShowSaveDialog(true);
      return;
    }

    if (!currentUser) {
      setOutput('You must be logged in to save files.');
      setHasErrors(true);
      return;
    }

    try {
      if (file?.id) {
        await updateFile(currentUser.uid, file.id, {
          ...file,
          content: code,
          modifiedAt: new Date().toISOString()
        });
        setOutput(`File ${fileName} saved successfully.`);
      } else {
        const extension = EXTENSIONS[mode] || '.txt';
        const newFileName = `${stripKnownExtension(fileName)}${extension}`;

        await createFile(currentUser.uid, {
          name: newFileName,
          content: code,
          type: mode,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        });

        setFileName(newFileName);
        setOutput(`File ${newFileName} saved successfully.`);
      }
      setHasErrors(false);
    } catch (error) {
      setOutput(`Error saving file: ${error.message}`);
      setHasErrors(true);
    }
  }, [code, currentUser, file, fileName, mode]);


  const handleSaveAs = useCallback(async (name, content = code) => {
    // FileExplorer calls onSaveAs(null) when the user hits Cancel
    if (!name) {
      setShowSaveDialog(false);
      return;
    }

    if (!currentUser) {
      setOutput('You must be logged in to save files.');
      setHasErrors(true);
      return;
    }

    try {
      const fileType = mode;
      const extension = EXTENSIONS[fileType] || '.txt';
      const newFileName = `${stripKnownExtension(name)}${extension}`;

      const existingFiles = await getFilesByName(currentUser.uid, newFileName);

      if (existingFiles.length > 0) {
        if (window.confirm(`A file named "${newFileName}" already exists. Do you want to replace it?`)) {
          await updateFile(currentUser.uid, existingFiles[0].id, {
            ...existingFiles[0],
            content,
            modifiedAt: new Date().toISOString()
          });
        } else {
          return;
        }
      } else {
        await createFile(currentUser.uid, {
          name: newFileName,
          content,
          type: fileType,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        });
      }

      setFileName(newFileName);
      setOutput(`File ${newFileName} saved successfully.`);
      setHasErrors(false);
      setShowSaveDialog(false);
    } catch (error) {
      setOutput(`Error saving file: ${error.message}`);
      setHasErrors(true);
    }
  }, [code, currentUser, mode]);


  if (showSaveDialog) {
    return (
      <>
        <div className="code-editor">
          <div className="code-editor-header">
            <div className="code-editor-menu-item">
              File
              <div className="code-editor-menu-dropdown">
                <button className="code-editor-menu-option" onClick={saveFile}>
                  Save
                </button>
                <button className="code-editor-menu-option" onClick={() => saveFile(true)}>
                  Save As...
                </button>
                <button className="code-editor-menu-option" onClick={onClose}>
                  Exit
                </button>
              </div>
            </div>
            <div className="code-editor-menu-item">
              Edit
              <div className="code-editor-menu-dropdown">
                <button className="code-editor-menu-option" onClick={() => document.execCommand('copy')}>
                  Copy
                </button>
                <button className="code-editor-menu-option" onClick={() => document.execCommand('paste')}>
                  Paste
                </button>
                <button className="code-editor-menu-option" onClick={() => document.execCommand('cut')}>
                  Cut
                </button>
              </div>
            </div>
            <div className="code-editor-menu-item">
              Language
              <div className="code-editor-menu-dropdown">
                <button
                  className="code-editor-menu-option"
                  onClick={() => switchLanguage('python')}
                >
                  Python
                </button>
                <button
                  className="code-editor-menu-option"
                  onClick={() => switchLanguage('pyg')}
                >
                  PYG
                </button>
                <button className="code-editor-menu-option" onClick={() => switchLanguage('javascript')}>
                  JavaScript
                </button>
                <button className="code-editor-menu-option" onClick={() => switchLanguage('c')}>
                  C
                </button>
                <button className="code-editor-menu-option" onClick={() => switchLanguage('cpp')}>
                  C++
                </button>
              </div>
            </div>
            <div className="code-editor-menu-item">
              AI
              <div className="code-editor-menu-dropdown">
                <button className="code-editor-menu-option" onClick={() => setShowAIPanel(v => !v)}>
                  {showAIPanel ? 'Hide AI Assistant' : 'AI Assistant'}
                </button>
                <button className="code-editor-menu-option" onClick={() => setShowAISettings(true)}>
                  Settings...
                </button>
              </div>
            </div>
            <button
              className="run-button"
              onClick={runCode}
              disabled={isRunning}
            >
              ▶ Run
            </button>
            {isRunning && (
              <button className="stop-button" onClick={stopCode}>
                ■ Stop
              </button>
            )}
            <span className="code-editor-filename">{fileName}</span>
          </div>
          <div className={`code-editor-body${showAIPanel ? ' code-editor-body--with-ai' : ''}`}>
            <div className="code-editor-main">
              <div
                ref={editorRef}
                className="code-editor-textarea"
                contentEditable
                spellCheck="false"
                onInput={handleContentChange}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                role="textbox"
                aria-label={mode === 'python' ? 'Python code editor' : 'PYG code editor'}
                tabIndex={0}
              />
              <div className="code-editor-output">
                <div className="code-editor-output-title">Output:</div>
                <div className={`code-editor-output-content ${hasErrors ? 'error' : ''}`}>
                  {output || 'Code output will appear here after execution.'}
                </div>
              </div>
            </div>
            {showAIPanel && (
              <AIPanel code={code} language={mode} output={output} onClose={() => setShowAIPanel(false)} />
            )}
            {inlineCompletion && (
              <div className="ai-inline-tooltip" style={{ top: inlineCompletion.position.top, left: inlineCompletion.position.left }}>
                <span className="ai-inline-suggestion">{inlineCompletion.text}</span>
                <span className="ai-inline-hint"> Tab to accept · Esc to dismiss</span>
              </div>
            )}
            {isCompletionLoading && <div className="ai-inline-loading">AI thinking...</div>}
          </div>
          {showAISettings && <AISettings onClose={() => setShowAISettings(false)} onSave={() => { }} />}
        </div>
        <div className="save-dialog-overlay" role="dialog" aria-label="Save As Dialog">
          <div className="save-dialog">
            <div className="save-dialog-title">Save As</div>
            <FileExplorer
              mode="saveAs"
              onSaveAs={handleSaveAs}
              initialFileName={file?.name || fileName}
              currentContent={code}
              fileType="code"
              enforceExtension={false}
            />
          </div>
        </div>
      </>
    );
  }


  return (
    <div className="code-editor">
      <div className="code-editor-header">
        <div className="code-editor-menu-item">
          File
          <div className="code-editor-menu-dropdown">
            <button className="code-editor-menu-option" onClick={saveFile}>
              Save
            </button>
            <button className="code-editor-menu-option" onClick={() => saveFile(true)}>
              Save As...
            </button>
            <button className="code-editor-menu-option" onClick={onClose}>
              Exit
            </button>
          </div>
        </div>
        <div className="code-editor-menu-item">
          Edit
          <div className="code-editor-menu-dropdown">
            <button className="code-editor-menu-option" onClick={() => document.execCommand('copy')}>
              Copy
            </button>
            <button className="code-editor-menu-option" onClick={() => document.execCommand('paste')}>
              Paste
            </button>
            <button className="code-editor-menu-option" onClick={() => document.execCommand('cut')}>
              Cut
            </button>
          </div>
        </div>
        <div className="code-editor-menu-item">
          Language
          <div className="code-editor-menu-dropdown">
            <button
              className="code-editor-menu-option"
              onClick={() => { if (mode === 'pyg') toggleMode(); else setMode('python'); }}
            >
              Python
            </button>
            <button
              className="code-editor-menu-option"
              onClick={() => { if (mode === 'python') toggleMode(); else setMode('pyg'); }}
            >
              PYG
            </button>
            <button className="code-editor-menu-option" onClick={() => setMode('javascript')}>
              JavaScript
            </button>
            <button className="code-editor-menu-option" onClick={() => setMode('c')}>
              C
            </button>
            <button className="code-editor-menu-option" onClick={() => setMode('cpp')}>
              C++
            </button>
          </div>
        </div>
        <div className="code-editor-menu-item">
          AI
          <div className="code-editor-menu-dropdown">
            <button className="code-editor-menu-option" onClick={() => setShowAIPanel(v => !v)}>
              {showAIPanel ? 'Hide AI Assistant' : 'AI Assistant'}
            </button>
            <button className="code-editor-menu-option" onClick={() => setShowAISettings(true)}>
              Settings...
            </button>
          </div>
        </div>
        <div className="code-editor-controls">
          <button
            className="run-button"
            onClick={runCode}
            disabled={isRunning}
          >
            ▶ Run
          </button>
          {isRunning && (
            <button className="stop-button" onClick={stopCode}>
              ■ Stop
            </button>
          )}
          <span className="code-editor-filename">{fileName}</span>
        </div>
      </div>
      <div className={`code-editor-body${showAIPanel ? ' code-editor-body--with-ai' : ''}`}>
        <div className="code-editor-main">
          <div
            ref={editorRef}
            className="code-editor-textarea"
            contentEditable
            spellCheck="false"
            onInput={handleContentChange}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            role="textbox"
            aria-label={mode === 'python' ? 'Python code editor' : 'PYG code editor'}
            tabIndex={0}
          />
          <div className="code-editor-output">
            <div className="code-editor-output-title">Output:</div>
            <div className={`code-editor-output-content ${hasErrors ? 'error' : ''}`}>
              {output || 'Code output will appear here after execution.'}
            </div>
          </div>
        </div>
        {showAIPanel && (
          <AIPanel code={code} language={mode} output={output} onClose={() => setShowAIPanel(false)} />
        )}
        {inlineCompletion && (
          <div className="ai-inline-tooltip" style={{ top: inlineCompletion.position.top, left: inlineCompletion.position.left }}>
            <span className="ai-inline-suggestion">{inlineCompletion.text}</span>
            <span className="ai-inline-hint"> Tab to accept · Esc to dismiss</span>
          </div>
        )}
        {isCompletionLoading && <div className="ai-inline-loading">AI thinking...</div>}
      </div>
      {showAISettings && <AISettings onClose={() => setShowAISettings(false)} onSave={() => { }} />}
    </div>
  );
};

export default CodeEditor; 