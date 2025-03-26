import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../firebase/AuthContext';
import { createFile, updateFile, getFilesByName } from '../../firebase/fileService';
import { runPython } from '../../utils/python/pythonRuntime';
import { pythonToPYG, PYGToPython } from '../../utils/pyg/translator';
import { PYTHON_KEYWORDS, PYG_KEYWORDS } from '../../utils/pyg/mappings';
import FileExplorer from '../FileExplorer/FileExplorer';
import './CodeEditor.css';

const DEFAULT_PYTHON_CODE = `# Welcome to CodeEditor
# Write your Python code here
print("Hello, world!")
`;

const CodeEditor = ({ file, onClose, setWindowTitle }) => {
  const [code, setCode] = useState(file?.content || DEFAULT_PYTHON_CODE);
  const [output, setOutput] = useState('');
  const [fileName, setFileName] = useState(file?.name || 'Untitled.py');
  const [mode, setMode] = useState(file?.name?.endsWith('.pyg') ? 'pyg' : 'python');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const { currentUser } = useAuth();
  
  const editorRef = useRef(null);
  const isInitialMount = useRef(true);
  const highlightTimeoutRef = useRef(null);
  const justPressedKeyRef = useRef(false);
  const keyTimeoutRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

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
    
    return cleanupTimeouts;
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
            
            const commentIndex = line.indexOf('#');
            
            if (commentIndex >= 0) {
              if (commentIndex > 0) {
                const codePart = line.substring(0, commentIndex);
                appendHighlightedText(lineDiv, codePart, mode);
              }
              
              const commentSpan = document.createElement('span');
              commentSpan.textContent = line.substring(commentIndex);
              commentSpan.className = mode === 'python' ? 'python-comment' : 'pyg-comment';
              lineDiv.appendChild(commentSpan);
            } else {
              appendHighlightedText(lineDiv, line, mode);
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
      stringSpan.className = highlightMode === 'python' ? 'python-string' : 'pyg-string';
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
    
    
    const keywords = highlightMode === 'python' ? PYTHON_KEYWORDS : PYG_KEYWORDS;
    const wordRegex = /([a-zA-Z_]\w*)|([0-9]+(?:\.[0-9]+)?)|(\s+)|([^\w\s])/g;
    
    
    let match;
    while ((match = wordRegex.exec(text)) !== null) {
      const [fullMatch, word, number, whitespace, punctuation] = match;
      
      if (word) {
        
        const isFunction = text.substring(match.index + word.length).trim().startsWith('(');
          
        if (isFunction) {
          const span = document.createElement('span');
          span.textContent = word;
          span.className = highlightMode === 'python' ? 'python-function' : 'pyg-function';
          container.appendChild(span);
        } else if (keywords.includes(word)) {
          const span = document.createElement('span');
          span.textContent = word;
          span.className = highlightMode === 'python' ? 'python-keyword' : 'pyg-keyword';
          container.appendChild(span);
        } else {
          container.appendChild(document.createTextNode(word));
        }
      } else if (number) {
        const span = document.createElement('span');
        span.textContent = number;
        span.className = highlightMode === 'python' ? 'python-number' : 'pyg-number';
        container.appendChild(span);
      } else if (whitespace || punctuation) {
        container.appendChild(document.createTextNode(fullMatch));
      }
    }
  };

  
  const handleContentChange = useCallback((e) => {
    
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
  }, []);
  
  
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

  
  const runCode = useCallback(async () => {
    if (!code.trim()) {
      setOutput('No code to run');
      setHasErrors(true);
      return;
    }

    setIsRunning(true);
    setOutput('Running...');
    setHasErrors(false);

    try {
      const codeToRun = mode === 'pyg' ? PYGToPython(code) : code;
      
      let outputText = '';
      const appendOutput = (text) => {
        outputText += text + '\n';
        setOutput(outputText.trim());
      };

      await runPython(
        codeToRun,
        (text) => appendOutput(text),
        (error) => {
          appendOutput(`Error: ${error}`);
          setHasErrors(true);
        }
      );

      if (!outputText.trim()) {
        setOutput('Code executed successfully with no output.');
      }
    } catch (error) {
      setOutput(`Error running code: ${error.message}`);
      setHasErrors(true);
    } finally {
      setIsRunning(false);
    }
  }, [code, mode]);

  
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
        const extension = mode === 'python' ? '.py' : mode === 'pyg' ? '.pyg' : '.txt';
        const newFileName = fileName.endsWith(extension) ? fileName : `${fileName}${extension}`;
        
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
    if (!currentUser) {
      setOutput('You must be logged in to save files.');
      setHasErrors(true);
      return;
    }

    try {
      const fileType = mode;
      const extension = fileType === 'python' ? '.py' : fileType === 'pyg' ? '.pyg' : '.txt';
      const newFileName = name.endsWith(extension) ? name : `${name}${extension}`;
      
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
                  onClick={() => mode === 'pyg' && toggleMode()}
                >
                  Python
                </button>
                <button 
                  className="code-editor-menu-option" 
                  onClick={() => mode === 'python' && toggleMode()}
                >
                  PYG
                </button>
              </div>
            </div>
            <button 
              className="run-button" 
              onClick={runCode}
              disabled={isRunning}
            >
              {isRunning ? 'Running...' : '▶ Run'}
            </button>
          </div>
          <div className="code-editor-body">
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
              onClick={() => mode === 'pyg' && toggleMode()}
            >
              Python
            </button>
            <button 
              className="code-editor-menu-option" 
              onClick={() => mode === 'python' && toggleMode()}
            >
              PYG
            </button>
          </div>
        </div>
        <div className="code-editor-controls">
          <button 
            className="run-button" 
            onClick={runCode}
            disabled={isRunning}
          >
            {isRunning ? 'Running...' : '▶ Run'}
          </button>
        </div>
      </div>
      <div className="code-editor-body">
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
    </div>
  );
};

export default CodeEditor; 