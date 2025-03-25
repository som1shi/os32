import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../firebase/AuthContext';
import { createFile, updateFile, getFilesByName } from '../../firebase/fileService';
import { runPython } from '../../utils/python/pythonRuntime';
import { pythonToPYG, PYGToPython } from '../../utils/pyg/translator';
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

  useEffect(() => {
    if (setWindowTitle) {
      setWindowTitle(`CodeEditor - ${fileName}`);
    }
  }, [fileName, setWindowTitle]);

  useEffect(() => {
    if (editorRef.current && code) {
      updateEditorContent(code, mode);
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = setTimeout(() => {
      if (editorRef.current) {
        const content = editorRef.current.innerText;
        let highlighted = content;

        if (mode === 'python') {
          highlighted = highlightPython(content);
        } else if (mode === 'pyg') {
          highlighted = highlightPYG(content);
        }

        if (highlighted !== content) {
          const selection = window.getSelection();
          const range = selection.getRangeAt(0);
          const offset = range.startOffset;
          const node = range.startContainer;

          editorRef.current.innerHTML = highlighted;

          try {
            if (node.nodeType === Node.TEXT_NODE) {
              const textNodes = getTextNodes(editorRef.current);
              let currentOffset = 0;
              let targetNode = null;

              for (const textNode of textNodes) {
                const nextOffset = currentOffset + textNode.length;
                if (currentOffset <= offset && offset <= nextOffset) {
                  targetNode = textNode;
                  break;
                }
                currentOffset = nextOffset;
              }

              if (targetNode) {
                const newRange = document.createRange();
                newRange.setStart(targetNode, Math.min(offset, targetNode.length));
                newRange.setEnd(targetNode, Math.min(offset, targetNode.length));
                selection.removeAllRanges();
                selection.addRange(newRange);
              }
            }
          } catch (e) {
            console.error('Error restoring cursor position:', e);
          }
        }
      }
    }, 300);

    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [code, mode]);

  const getTextNodes = (element) => {
    const textNodes = [];
    const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walk.nextNode())) {
      textNodes.push(node);
    }
    return textNodes;
  };

  
  const updateEditorContent = (content, contentMode) => {
    if (!editorRef.current) return;
    
    editorRef.current.innerText = content;
    
    setTimeout(() => {
      if (editorRef.current) {
        if (contentMode === 'python') {
          editorRef.current.innerHTML = highlightPython(content);
        } else if (contentMode === 'pyg') {
          editorRef.current.innerHTML = highlightPYG(content);
        }
      }
    }, 10);
  };

  const handleContentChange = (e) => {
    const content = e.target.innerText;
    setCode(content);
  };

  
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  
  const handleKeyDown = (e) => {
    
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '  ');
    }
  };

  
  const toggleMode = () => {
    if (mode === 'python') {
      try {
        const pygCode = pythonToPYG(code);
        setCode(pygCode);
        setMode('pyg');
        if (fileName.endsWith('.py')) {
          setFileName(fileName.replace('.py', '.pyg'));
        }
        
        
        updateEditorContent(pygCode, 'pyg');
      } catch (error) {
        setOutput(`Error converting to PYG: ${error.message}`);
        setHasErrors(true);
      }
    } else {
      try {
        const pythonCode = PYGToPython(code);
        setCode(pythonCode);
        setMode('python');
        if (fileName.endsWith('.pyg')) {
          setFileName(fileName.replace('.pyg', '.py'));
        }
        
        updateEditorContent(pythonCode, 'python');
      } catch (error) {
        setOutput(`Error converting to Python: ${error.message}`);
        setHasErrors(true);
      }
    }
  };

  
  const runCode = async () => {
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
  };

  
  const saveFile = async (showDialog = false) => {
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
  };

  
  const handleSaveAs = async (name, content = code) => {
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
  };

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