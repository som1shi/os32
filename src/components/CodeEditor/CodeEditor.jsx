import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../firebase/AuthContext';
import { createFile, updateFile, getFilesByName } from '../../firebase/fileService';
import { runPython } from '../../utils/python/pythonRuntime';
import { pythonToPYG, PYGToPython } from '../../utils/pyg/translator';
import { compileToRISCV } from '../../utils/riscv/compiler';
import { runRISCV } from '../../utils/riscv/simulator';
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
  const [riscvCode, setRiscvCode] = useState('');
  const [showRiscvView, setShowRiscvView] = useState(false);
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
        } else if (mode === 'riscv') {
          highlighted = highlightRISCV(content);
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

  const highlightPython = (text) => {
    const keywords = ['import', 'from', 'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'as', 'return', 'yield', 'break', 'continue', 'pass', 'in', 'is', 'not', 'and', 'or', 'True', 'False', 'None'];
    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    
    let processed = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    
    processed = processed
      
      .replace(keywordRegex, '<span class="python-keyword">$1</span>')
      
      .replace(/(["'])(.*?)\1/g, '<span class="python-string">$1$2$1</span>')
      
      .replace(/\b(\d+)\b/g, '<span class="python-number">$1</span>')
      
      .replace(/\bdef\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, '<span class="python-keyword">def</span> <span class="python-function">$1</span>')
      
      .replace(/(#.*)$/gm, '<span class="python-comment">$1</span>');
    
    return processed;
  };

  
  const highlightPYG = (text) => {
    
    const keywords = ['yo', 'fam', 'bop', 'squad', 'lit', 'nope', 'yeet', 'flex', 'sus', 'btw', 'rn', 'srsly', 'legit', 'omg', 'jk', 'af', 'tbh', 'yolo', 'vibin', 'rizz'];
    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    
    
    let processed = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    
    processed = processed
      
      .replace(keywordRegex, '<span class="pyg-keyword">$1</span>')
      
      .replace(/(["'])(.*?)\1/g, '<span class="pyg-string">$1$2$1</span>')
      
      .replace(/\b(\d+)\b/g, '<span class="pyg-number">$1</span>')
      
      .replace(/\bbop\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, '<span class="pyg-keyword">bop</span> <span class="pyg-function">$1</span>')
      
      .replace(/(#.*)$/gm, '<span class="pyg-comment">$1</span>');
    
    return processed;
  };

  const highlightRISCV = (text) => {
    const instructions = [
      'add', 'addi', 'sub', 'lui', 'auipc', 'jal', 'jalr', 
      'beq', 'bne', 'blt', 'bge', 'bltu', 'bgeu',
      'lb', 'lh', 'lw', 'lbu', 'lhu', 'sb', 'sh', 'sw',
      'sll', 'slli', 'srl', 'srli', 'sra', 'srai',
      'and', 'andi', 'or', 'ori', 'xor', 'xori',
      'slt', 'slti', 'sltu', 'sltiu',
      'fence', 'ecall', 'ebreak',
      'mul', 'mulh', 'mulhu', 'mulhsu', 'div', 'divu', 'rem', 'remu'
    ];
    
    const registers = [
      'zero', 'ra', 'sp', 'gp', 'tp', 
      'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7',
      't0', 't1', 't2', 't3', 't4', 't5', 't6',
      's0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11',
      'x0', 'x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'x8', 'x9', 'x10', 'x11', 'x12', 'x13', 'x14', 'x15',
      'x16', 'x17', 'x18', 'x19', 'x20', 'x21', 'x22', 'x23', 'x24', 'x25', 'x26', 'x27', 'x28', 'x29', 'x30', 'x31'
    ];
    
    const directives = [
      '.text', '.data', '.rodata', '.bss',
      '.byte', '.half', '.word', '.string',
      '.align', '.global', '.section', '.type'
    ];
    
    const instructionRegex = new RegExp(`\\b(${instructions.join('|')})\\b`, 'g');
    const registerRegex = new RegExp(`\\b(${registers.join('|')})\\b`, 'g');
    const directiveRegex = new RegExp(`\\b(${directives.join('|')})\\b`, 'g');
    
    let processed = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    processed = processed
        
      .replace(directiveRegex, '<span class="riscv-directive">$1</span>')
      
      .replace(instructionRegex, '<span class="riscv-instruction">$1</span>')
      
      .replace(registerRegex, '<span class="riscv-register">$1</span>')
      
      .replace(/\b(-?\d+)\b/g, '<span class="riscv-number">$1</span>')
      
      .replace(/\b(0x[0-9a-fA-F]+)\b/g, '<span class="riscv-number">$1</span>')
      
      .replace(/^([a-zA-Z0-9_]+):/gm, '<span class="riscv-label">$1:</span>')
      
      .replace(/(#.*)$/gm, '<span class="riscv-comment">$1</span>');
    
    return processed;
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
      } catch (error) {
        setOutput(`Error converting to PYG: ${error.message}`);
        setHasErrors(true);
      }
    } else if (mode === 'pyg') {
      try {
        const pythonCode = PYGToPython(code);
        setCode(pythonCode);
        setMode('python');
        if (fileName.endsWith('.pyg')) {
          setFileName(fileName.replace('.pyg', '.py'));
        }
      } catch (error) {
        setOutput(`Error converting to Python: ${error.message}`);
        setHasErrors(true);
      }
    }
  };

  
  const compileCode = () => {
    if (!code.trim()) {
      setOutput('No code to compile');
      setHasErrors(true);
      return;
    }

    setIsRunning(true);
    setOutput('Compiling to RISC-V...');
    setHasErrors(false);

    try {
      
      const riscvAssembly = compileToRISCV(code, mode);
      setRiscvCode(riscvAssembly);
      setShowRiscvView(true);
      setOutput('Compilation successful! View the RISC-V assembly in the RISC-V tab.');
    } catch (error) {
      setOutput(`Compilation error: ${error.message}`);
      setHasErrors(true);
    } finally {
      setIsRunning(false);
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
        setOutput(outputText);
      };

      await runPython(
        codeToRun,
        (text) => appendOutput(text),
        (error) => {
          appendOutput(`Error: ${error}`);
          setHasErrors(true);
        }
      );

      if (!outputText) {
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

  
  const saveRiscvFile = async () => {
    if (!currentUser) {
      setOutput('You must be logged in to save files.');
      setHasErrors(true);
      return;
    }

    try {
      const riscvFileName = fileName.replace(/\.(py|pyg)$/, '.s');
      
      await createFile(currentUser.uid, {
        name: riscvFileName,
        content: riscvCode,
        type: 'riscv',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      });
      
      setOutput(`RISC-V assembly saved as ${riscvFileName}`);
      setHasErrors(false);
    } catch (error) {
      setOutput(`Error saving RISC-V file: ${error.message}`);
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

  
  const runRiscvCode = async () => {
    if (!riscvCode.trim()) {
      setOutput('No RISC-V code to run');
      setHasErrors(true);
      return;
    }

    setIsRunning(true);
    setOutput('Running RISC-V code...');
    setHasErrors(false);

    try {
      let outputText = '';
      const appendOutput = (text) => {
        outputText += text;
        setOutput(outputText);
      };

      const result = runRISCV(riscvCode, appendOutput);
      
      if (!outputText) {
        setOutput('RISC-V code executed successfully with no output.');
      }
    } catch (error) {
      setOutput(`Error running RISC-V code: ${error.message}`);
      setHasErrors(true);
    } finally {
      setIsRunning(false);
    }
  };

  
  const renderEditor = () => {
    if (showRiscvView) {
      return (
        <div
          ref={editorRef}
          className="code-editor-textarea"
          contentEditable
          spellCheck="false"
          onInput={handleContentChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          role="textbox"
          aria-label="RISC-V assembly code"
          tabIndex={0}
        >
          {riscvCode}
        </div>
      );
    } else {
      return (
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
      );
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
            {showRiscvView && (
              <button className="code-editor-menu-option" onClick={saveRiscvFile}>
                Save RISC-V
              </button>
            )}
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
              onClick={() => {
                if (mode === 'pyg') toggleMode();
                if (mode === 'riscv') setShowRiscvView(false);
              }}
              disabled={mode === 'python'}
            >
              Python
            </button>
            <button 
              className="code-editor-menu-option" 
              onClick={() => {
                if (mode === 'python') toggleMode();
                if (mode === 'riscv') setShowRiscvView(false);
              }}
              disabled={mode === 'pyg'}
            >
              PYG
            </button>
          </div>
        </div>
        <div className="code-editor-menu-item">
          View
          <div className="code-editor-menu-dropdown">
            <button
              className="code-editor-menu-option"
              onClick={() => setShowRiscvView(false)}
            >
              Code Editor
            </button>
            <button
              className="code-editor-menu-option"
              onClick={() => {
                if (!riscvCode) {
                  compileCode();
                } else {
                  setShowRiscvView(true);
                }
              }}
            >
              RISC-V Assembly
            </button>
          </div>
        </div>
        
        <div className="code-editor-controls">
          {!showRiscvView ? (
            <>
              <button 
                className="run-button" 
                onClick={runCode}
                disabled={isRunning}
              >
                {isRunning ? 'Running...' : '▶ Run'}
              </button>
              <button
                className="run-button"
                onClick={compileCode}
                disabled={isRunning}
              >
                {isRunning ? 'Compiling...' : '⚙️ Compile'}
              </button>
            </>
          ) : (
            <>
              <button
                className="run-button"
                onClick={compileCode}
                disabled={isRunning}
              >
                {isRunning ? 'Compiling...' : '🔄 Recompile'}
              </button>
              <button
                className="run-button risc-run-button"
                onClick={runRiscvCode}
                disabled={isRunning}
              >
                {isRunning ? 'Running...' : '▶ Run RISC-V'}
              </button>
            </>
          )}
          <div className="xp-toggle">
            <button 
              className={!showRiscvView ? 'xp-toggle-active' : ''} 
              onClick={() => setShowRiscvView(false)}
            >
              Code
            </button>
            <button 
              className={showRiscvView ? 'xp-toggle-active' : ''} 
              onClick={() => {
                if (!riscvCode) {
                  compileCode();
                } else {
                  setShowRiscvView(true);
                }
              }}
            >
              RISC-V
            </button>
          </div>
        </div>
      </div>
      <div className="code-editor-body">
        {renderEditor()}
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