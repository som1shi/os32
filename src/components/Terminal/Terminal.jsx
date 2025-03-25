import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../firebase/AuthContext';
import { getFiles, createFile, deleteFile, updateFile } from '../../firebase/fileService';
import { runPython } from '../../utils/python/pythonRuntime';
import { pythonToPYG, PYGToPython } from '../../utils/pyg/translator';
import './Terminal.css';


const DESKTOP_APPS = [
  { name: 'Documents.app', id: 'explorer' },
  { name: 'Notepad.app', id: 'notepad' },
  { name: 'Terminal.app', id: 'terminal' },
  { name: 'InternetExplorer.app', id: 'internet' },
  { name: 'MusicPlayer.app', id: 'ipod-player' },
  { name: 'CodeEditor.app', id: 'codeeditor' },
  { name: 'WordSweeper.app', id: 'minesweeper' },
  { name: 'QuantumChess.app', id: 'quantumchess' },
  { name: 'RotateConnectFour.app', id: 'rotateconnectfour' },
  { name: 'Refiner.app', id: 'refiner' },
  { name: 'WikiConnect.app', id: 'wikiconnect' },
  { name: 'ColorMania.app', id: 'colormania' }
];

const FULLSCREEN_GAMES = [
  'minesweeper', 'quantumchess', 'rotateconnectfour', 
  'refiner', 'wikiconnect', 'colormania'
];

const FILE_SYSTEM = {
  root: {
    name: '/',
    type: 'directory',
    children: ['Desktop', 'Documents']
  },
  Desktop: {
    name: 'Desktop',
    type: 'directory',
    parent: 'root',
    children: DESKTOP_APPS.map(app => app.name)
  },
  Documents: {
    name: 'Documents',
    type: 'directory',
    parent: 'root',
    children: []
  }
};

const HELP_TEXT = `Available commands:
  help - Show this help message
  cd [directory] - Change directory
  ls - List files and directories
  pwd - Print working directory
  echo [text] - Display text
  clear - Clear terminal
  touch [name] - Create a new file
  cat [file] - Display file contents
  rm [file] - Remove a file
  date - Display current date and time
  whoami - Display current user
  exec [app] - Launch an application
  python [file.py] - Run Python file
  pyg [file.pyg] - Run PYG file
  py2pyg [file.py] - Convert Python to PYG
  pyg2py [file.pyg] - Convert PYG to Python`;

const Terminal = memo(({ onLaunchApp }) => {
  const [history, setHistory] = useState(() => [{ text: 'Welcome to os32 Terminal v1.0', type: 'system' }]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [currentPath] = useState('/');
  const [files, setFiles] = useState([]);
  const [currentDir, setCurrentDir] = useState('Desktop');
  const terminalRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  
  const { currentUser } = useAuth();

  
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  
  useEffect(() => {
    const handleClick = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    const terminal = terminalRef.current;
    if (terminal) {
      terminal.addEventListener('click', handleClick);
      return () => terminal.removeEventListener('click', handleClick);
    }
  }, []);

  
  useEffect(() => {
    if (!currentUser) {
      setFiles([]);
      return () => {};
    }
    
    const unsubscribe = getFiles(currentUser.uid, (userFiles) => {
      setFiles(userFiles);
    });
    
    return unsubscribe;
  }, [currentUser]);

  const addToHistory = useCallback((text, type = 'command') => {
    setHistory(prev => [...prev, { text, type }]);
  }, []);

  
  const executePython = useCallback(async (code, outputPrefix) => {
    addToHistory(`${outputPrefix}...`, 'output');
    try {
      await runPython(
        code, 
        text => addToHistory(text, 'output'),
        error => addToHistory(`Error: ${error}`, 'error')
      );
      addToHistory('Program completed.', 'output');
      return true;
    } catch (error) {
      addToHistory(`Error executing code: ${error.message}`, 'error');
      return false;
    }
  }, [addToHistory]);

  const handleCommand = useCallback(async (command) => {
    const cmd = command.trim();
    if (!cmd) return;

    addToHistory(`${currentPath}${currentDir}> ${cmd}`, 'prompt');

    const parts = cmd.split(' ');
    const mainCommand = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (mainCommand) {
      case 'help':
        addToHistory(HELP_TEXT, 'output');
        break;

      case 'cd':
        const target = args[0] || '/';
        if (target === '..') {
          if (currentDir !== 'root') {
            const parentDir = FILE_SYSTEM[currentDir].parent;
            setCurrentDir(parentDir);
          }
        } else if (target === '/') {
          setCurrentDir('root');
        } else if (target === '~') {
          setCurrentDir('Desktop');
        } else if (target === 'Documents' || target === 'Desktop') {
          setCurrentDir(target);
        } else {
          addToHistory(`cd: ${target}: No such directory`, 'error');
        }
        break;

      case 'ls':
        let output = '';
        
        if (currentDir === 'root') {
          output += 'Desktop\nDocuments\n';
        } else if (currentDir === 'Documents' && currentUser) {
          output += files.map(file => file.name).join('\n');
          if (files.length === 0) {
            output = 'No files found';
          }
        } else if (currentDir === 'Desktop') {
          output = DESKTOP_APPS.map(app => app.name).join('\n');
          if (output.length === 0) {
            output = 'No files found';
          }
        }
        
        addToHistory(output || 'Empty directory', 'output');
        break;

      case 'pwd':
        addToHistory(`/${currentDir === 'root' ? '' : currentDir}`, 'output');
        break;

      case 'echo':
        addToHistory(args.join(' '), 'output');
        break;

      case 'clear':
        setHistory([{ text: 'Terminal cleared', type: 'system' }]);
        break;

      case 'date':
        addToHistory(new Date().toString(), 'output');
        break;

      case 'whoami':
        addToHistory(currentUser ? currentUser.displayName || currentUser.email : 'Guest (Not logged in)', 'output');
        break;

      case 'exec':
        if (!args[0]) {
          addToHistory('exec: missing application name', 'error');
          break;
        }

        const appName = args[0].endsWith('.app') ? args[0] : `${args[0]}.app`;
        const appToLaunch = DESKTOP_APPS.find(app => app.name.toLowerCase() === appName.toLowerCase());
        
        if (!appToLaunch) {
          addToHistory(`exec: ${args[0]}: application not found`, 'error');
          addToHistory('Available applications:', 'output');
          addToHistory(DESKTOP_APPS.map(app => app.name).join('\n'), 'output');
          break;
        }

        addToHistory(`Launching ${appToLaunch.name}...`, 'output');
        
        if (FULLSCREEN_GAMES.includes(appToLaunch.id)) {
          addToHistory(`Opening ${appToLaunch.name} in full screen mode...`, 'output');
          navigate(`/game/${appToLaunch.id}`);
        } else if (typeof onLaunchApp === 'function') {
          onLaunchApp(appToLaunch.id);
        } else {
          addToHistory('App launching not available in this context', 'error');
        }
        break;

      case 'cat':
        if (!args[0]) {
          addToHistory('cat: missing file operand', 'error');
          break;
        }

        if (currentDir !== 'Documents') {
          addToHistory('cat: can only read files in Documents directory', 'error');
          break;
        }

        if (!currentUser) {
          addToHistory('cat: not logged in, cannot access files', 'error');
          break;
        }

        const fileToRead = files.find(f => f.name === args[0]);
        if (!fileToRead) {
          addToHistory(`cat: ${args[0]}: No such file`, 'error');
          break;
        }

        addToHistory(fileToRead.content || '(Empty file)', 'output');
        break;

      case 'touch':
        if (!args[0]) {
          addToHistory('touch: missing file operand', 'error');
          break;
        }

        if (currentDir !== 'Documents') {
          addToHistory('touch: can only create files in Documents directory', 'error');
          break;
        }

        if (!currentUser) {
          addToHistory('touch: not logged in, cannot create files', 'error');
          break;
        }

        try {
          const fileName = args[0].endsWith('.txt') ? args[0] : `${args[0]}.txt`;
          await createFile(currentUser.uid, {
            name: fileName,
            content: '',
            type: 'text',
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString()
          });
          addToHistory(`Created file: ${fileName}`, 'output');
        } catch (error) {
          addToHistory(`touch: error creating file: ${error.message}`, 'error');
        }
        break;

      case 'rm':
        if (!args[0]) {
          addToHistory('rm: missing file operand', 'error');
          break;
        }

        if (currentDir !== 'Documents') {
          addToHistory('rm: can only delete files in Documents directory', 'error');
          break;
        }

        if (!currentUser) {
          addToHistory('rm: not logged in, cannot delete files', 'error');
          break;
        }

        const fileToDelete = files.find(f => f.name === args[0]);
        if (!fileToDelete) {
          addToHistory(`rm: ${args[0]}: No such file`, 'error');
          break;
        }

        try {
          await deleteFile(currentUser.uid, fileToDelete.id);
          addToHistory(`Deleted file: ${args[0]}`, 'output');
        } catch (error) {
          addToHistory(`rm: error deleting file: ${error.message}`, 'error');
        }
        break;

      case 'python':
        if (!args[0]) {
          addToHistory('python: missing file operand', 'error');
          break;
        }

        if (currentDir !== 'Documents') {
          addToHistory('python: can only run files from Documents directory', 'error');
          break;
        }

        if (!currentUser) {
          addToHistory('python: not logged in, cannot access files', 'error');
          break;
        }

        const pythonFile = files.find(f => f.name === args[0]);
        if (!pythonFile) {
          addToHistory(`python: ${args[0]}: No such file`, 'error');
          break;
        }

        if (!pythonFile.name.endsWith('.py')) {
          addToHistory(`python: ${args[0]}: Not a Python file`, 'error');
          break;
        }

        await executePython(pythonFile.content, `Running ${args[0]}`);
        break;

      case 'pyg':
        if (!args[0]) {
          addToHistory('pyg: missing file operand', 'error');
          break;
        }

        if (currentDir !== 'Documents') {
          addToHistory('pyg: can only run files from Documents directory', 'error');
          break;
        }

        if (!currentUser) {
          addToHistory('pyg: not logged in, cannot access files', 'error');
          break;
        }

        const pygFile = files.find(f => f.name === args[0]);
        if (!pygFile) {
          addToHistory(`pyg: ${args[0]}: No such file`, 'error');
          break;
        }

        if (!pygFile.name.endsWith('.pyg')) {
          addToHistory(`pyg: ${args[0]}: Not a PYG file`, 'error');
          break;
        }

        
        const pythonCode = PYGToPython(pygFile.content);
        await executePython(pythonCode, `Running ${args[0]}`);
        break;

      case 'py2pyg':
        if (!args[0]) {
          addToHistory('py2pyg: missing file operand', 'error');
          break;
        }

        if (currentDir !== 'Documents') {
          addToHistory('py2pyg: can only convert files in Documents directory', 'error');
          break;
        }

        if (!currentUser) {
          addToHistory('py2pyg: not logged in, cannot access files', 'error');
          break;
        }

        const py2pygFile = files.find(f => f.name === args[0]);
        if (!py2pygFile) {
          addToHistory(`py2pyg: ${args[0]}: No such file`, 'error');
          break;
        }

        if (!py2pygFile.name.endsWith('.py')) {
          addToHistory(`py2pyg: ${args[0]}: Not a Python file`, 'error');
          break;
        }

        try {
          const pygCode = pythonToPYG(py2pygFile.content);
          const pygFileName = py2pygFile.name.replace('.py', '.pyg');
          
          await createFile(currentUser.uid, {
            name: pygFileName,
            content: pygCode,
            type: 'pyg',
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString()
          });
          
          addToHistory(`Converted ${args[0]} to ${pygFileName}`, 'output');
        } catch (error) {
          addToHistory(`py2pyg: error converting file: ${error.message}`, 'error');
        }
        break;

      case 'pyg2py':
        if (!args[0]) {
          addToHistory('pyg2py: missing file operand', 'error');
          break;
        }

        if (currentDir !== 'Documents') {
          addToHistory('pyg2py: can only convert files in Documents directory', 'error');
          break;
        }

        if (!currentUser) {
          addToHistory('pyg2py: not logged in, cannot access files', 'error');
          break;
        }

        const pyg2pyFile = files.find(f => f.name === args[0]);
        if (!pyg2pyFile) {
          addToHistory(`pyg2py: ${args[0]}: No such file`, 'error');
          break;
        }

        if (!pyg2pyFile.name.endsWith('.pyg')) {
          addToHistory(`pyg2py: ${args[0]}: Not a PYG file`, 'error');
          break;
        }

        try {
          const pyCode = PYGToPython(pyg2pyFile.content);
          const pyFileName = pyg2pyFile.name.replace('.pyg', '.py');
          
          await createFile(currentUser.uid, {
            name: pyFileName,
            content: pyCode,
            type: 'python',
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString()
          });
          
          addToHistory(`Converted ${args[0]} to ${pyFileName}`, 'output');
        } catch (error) {
          addToHistory(`pyg2py: error converting file: ${error.message}`, 'error');
        }
        break;

      default:
        addToHistory(`${mainCommand}: command not found`, 'error');
    }
  }, [currentDir, currentUser, files, currentPath, addToHistory, navigate, onLaunchApp, executePython]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommand(currentCommand);
      setCurrentCommand('');
    }
  }, [currentCommand, handleCommand]);

  
  const terminalContent = useMemo(() => (
    <div className="terminal-content">
      {history.map((item, index) => (
        <div key={index} className={`terminal-line terminal-${item.type}`}>
          {item.text}
        </div>
      ))}
      <div className="terminal-input-line">
        <span className="terminal-prompt">{currentPath}{currentDir}&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={currentCommand}
          onChange={e => setCurrentCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          className="terminal-input"
          autoFocus
        />
      </div>
    </div>
  ), [history, currentPath, currentDir, currentCommand, handleKeyDown]);

  return (
    <div className="terminal" ref={terminalRef}>
      {terminalContent}
    </div>
  );
});

Terminal.displayName = 'Terminal';

export default Terminal; 