import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../firebase/AuthContext';
import { getFiles, createFile, deleteFile, updateFile } from '../../firebase/fileService';
import './Terminal.css';

const Terminal = ({ onLaunchApp }) => {
  const [history, setHistory] = useState([{ text: 'Welcome to OS32 Terminal v1.0', type: 'system' }]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState([]);
  const [currentDir, setCurrentDir] = useState('Desktop');
  const terminalRef = useRef(null);
  const inputRef = useRef(null);
  
  const { currentUser } = useAuth();

  const desktopApps = [
    { name: 'Documents.app', id: 'explorer' },
    { name: 'Notepad.app', id: 'notepad' },
    { name: 'Terminal.app', id: 'terminal' },
    { name: 'InternetExplorer.app', id: 'internet' },
    { name: 'MusicPlayer.app', id: 'ipod-player' },
    { name: 'WordSweeper.app', id: 'minesweeper' },
    { name: 'QuantumChess.app', id: 'quantumchess' },
    { name: 'RotateConnectFour.app', id: 'rotateconnectfour' },
    { name: 'Refiner.app', id: 'refiner' },
    { name: 'WikiConnect.app', id: 'wikiconnect' },
    { name: 'ColorMania.app', id: 'colormania' }
  ];

  const fileSystem = {
    root: {
      name: '/',
      type: 'directory',
      children: ['Desktop', 'Documents']
    },
    Desktop: {
      name: 'Desktop',
      type: 'directory',
      parent: 'root',
      children: desktopApps.map(app => app.name)
    },
    Documents: {
      name: 'Documents',
      type: 'directory',
      parent: 'root',
      children: []
    }
  };

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

    if (terminalRef.current) {
      terminalRef.current.addEventListener('click', handleClick);
    }

    return () => {
      if (terminalRef.current) {
        terminalRef.current.removeEventListener('click', handleClick);
      }
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = getFiles(currentUser.uid, (userFiles) => {
        setFiles(userFiles);
      });
      return () => unsubscribe();
    } else {
      setFiles([]);
    }
  }, [currentUser]);

  const addToHistory = useCallback((text, type = 'command') => {
    setHistory(prev => [...prev, { text, type }]);
  }, []);

  const handleCommand = useCallback(async (command) => {
    const cmd = command.trim();
    if (!cmd) return;

    addToHistory(`${currentPath}${currentDir}> ${cmd}`, 'prompt');

    const parts = cmd.split(' ');
    const mainCommand = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (mainCommand) {
      case 'help':
        addToHistory(`Available commands:
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
  exec [app] - Launch an application`, 'output');
        break;

      case 'cd':
        const target = args[0] || '/';
        if (target === '..') {
          if (currentDir !== 'root') {
            const parentDir = fileSystem[currentDir].parent;
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
          output = desktopApps.map(app => app.name).join('\n');
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
        const appToLaunch = desktopApps.find(app => app.name.toLowerCase() === appName.toLowerCase());
        
        if (!appToLaunch) {
          addToHistory(`exec: ${args[0]}: application not found`, 'error');
          addToHistory('Available applications:', 'output');
          addToHistory(desktopApps.map(app => app.name).join('\n'), 'output');
          break;
        }

        addToHistory(`Launching ${appToLaunch.name}...`, 'output');
        
        if (typeof onLaunchApp === 'function') {
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

      default:
        addToHistory(`${mainCommand}: command not found`, 'error');
    }
  }, [currentDir, currentUser, files, currentPath, addToHistory, desktopApps, onLaunchApp]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommand(currentCommand);
      setCurrentCommand('');
    }
  }, [currentCommand, handleCommand]);

  return (
    <div className="terminal" ref={terminalRef}>
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
    </div>
  );
};

export default Terminal; 