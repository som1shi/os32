import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { useAuth } from '../../firebase/AuthContext';
import { getFiles, createFile, deleteFile, updateFile } from '../../firebase/fileService';
import ContextMenu from './ContextMenu';
import './FileExplorer.css';

const FILE_EXTENSION = '.txt';
const BASE_FILE_NAME = 'New Text Document';
const ERROR_MESSAGES = {
  DELETE_CONFIRM: 'Are you sure you want to delete this file?',
  FILE_EXISTS: 'A file with this name already exists. Do you want to replace it?',
  SIGN_IN_PROMPT: 'You need to sign in to create files. Would you like to sign in now?',
  ERROR_RENAME: 'Error renaming file:',
  ERROR_DELETE: 'Error deleting file:',
  SAVE_FAILED: 'Error saving file. Please try again later.'
};

const FileExplorer = memo(({ onOpenFile, mode = 'browse', onSaveAs = null, initialFileName = '', currentContent = '' }) => {
  const [files, setFiles] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [saveAsFileName, setSaveAsFileName] = useState(initialFileName);
  const [isKeyboardNav, setIsKeyboardNav] = useState(false);

  const { currentUser, signInWithGoogle } = useAuth();

  const renameInputRef = useRef(null);
  const saveAsInputRef = useRef(null);
  const isMountedRef = useRef(true);
  const fileListRef = useRef(null);

  const getNextFileName = useCallback(() => {
    const existingNames = files.map(file => file.name);
    let counter = 0;
    let newFileName = `${BASE_FILE_NAME}${FILE_EXTENSION}`;

    while (existingNames.includes(newFileName)) {
      counter++;
      newFileName = `${BASE_FILE_NAME} (${counter})${FILE_EXTENSION}`;
    }

    return newFileName;
  }, [files]);

  const validateFileName = useCallback((name) => {
    const trimmedName = name?.trim();
    if (!trimmedName) return null;
    
    const sanitized = trimmedName.replace(/[\\/:*?"<>|]/g, '_');
    return sanitized.endsWith(FILE_EXTENSION) ? sanitized : `${sanitized}${FILE_EXTENSION}`;
  }, []);

  const handleCreateFile = useCallback(async () => {
    if (!currentUser) {
      try {
        const shouldLogin = window.confirm(ERROR_MESSAGES.SIGN_IN_PROMPT);
        if (shouldLogin) {
          await signInWithGoogle();
        }
      } catch (error) {
        console.error('Error during sign in:', error);
      }
      return;
    }

    try {
      const newFileName = getNextFileName();
      await createFile(currentUser.uid, {
        name: newFileName,
        content: '',
        type: 'text',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating file:', error);
    }
  }, [currentUser, getNextFileName, signInWithGoogle]);

  const handleRenameSubmit = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedFile || !renameInputRef.current || !currentUser) return;

    try {
      const newName = validateFileName(renameInputRef.current.value);
      if (!newName) {
        throw new Error('Invalid filename');
      }
      
      if (newName !== selectedFile.name) {
        const nameExists = files.some(f => 
          f.id !== selectedFile.id && f.name.toLowerCase() === newName.toLowerCase()
        );
        
        if (nameExists) {
          const overwrite = window.confirm(ERROR_MESSAGES.FILE_EXISTS);
          if (!overwrite) {
            setIsRenaming(false);
            setSelectedFile(null);
            return;
          }
        }
        
        await updateFile(currentUser.uid, selectedFile.id, {
          ...selectedFile,
          name: newName,
          modifiedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(ERROR_MESSAGES.ERROR_RENAME, error);
    } finally {
      if (isMountedRef.current) {
        setIsRenaming(false);
        setSelectedFile(null);
      }
    }
  }, [selectedFile, currentUser, validateFileName, files]);

  const handleRenameCancel = useCallback(() => {
    setIsRenaming(false);
    setSelectedFile(null);
  }, []);

  const handleDeleteFile = useCallback(async (fileId) => {
    if (!currentUser) return;
    
    try {
      const confirmed = window.confirm(ERROR_MESSAGES.DELETE_CONFIRM);
      if (!confirmed) return;
      
      await deleteFile(currentUser.uid, fileId);
    } catch (error) {
      console.error(ERROR_MESSAGES.ERROR_DELETE, error);
    }
  }, [currentUser]);

  const handleRenameFile = useCallback((file) => {
    setSelectedFile(file);
    setIsRenaming(true);
  }, []);

  const handleSaveAs = useCallback(async (e) => {
    e.preventDefault();
    if (!currentUser || !onSaveAs) return;

    try {
      const fileName = validateFileName(saveAsFileName);
      if (!fileName) {
        throw new Error('Please enter a valid filename');
      }

      const existingFile = files.find(file => 
        file.name.toLowerCase() === fileName.toLowerCase()
      );
      
      if (existingFile) {
        const overwrite = window.confirm(ERROR_MESSAGES.FILE_EXISTS);
        if (!overwrite) return;
      }

      await onSaveAs(fileName, currentContent);
    } catch (error) {
      console.error('Error in Save As:', error);
      if (isMountedRef.current) {
        alert(error.message || ERROR_MESSAGES.SAVE_FAILED);
      }
    }
  }, [currentUser, files, onSaveAs, saveAsFileName, validateFileName, currentContent]);

  const handleContextMenu = useCallback((e, file = null) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;

    const menuOptions = file ? [
      { icon: '📝', label: 'Open', onClick: () => onOpenFile(file) },
      { separator: true },
      { icon: '✏️', label: 'Rename', onClick: () => handleRenameFile(file) },
      { icon: '🗑️', label: 'Delete', onClick: () => handleDeleteFile(file.id) }
    ] : [
      { icon: '📄', label: 'New Text Document', onClick: handleCreateFile }
    ];

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      options: menuOptions
    });
  }, [currentUser, handleCreateFile, handleDeleteFile, handleRenameFile, onOpenFile]);

  const handleKeyDown = useCallback((e, file) => {
    if (!file) return;
    
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (mode === 'saveAs') {
          setSaveAsFileName(file.name);
        } else {
          onOpenFile(file);
        }
        break;
      case 'F2':
        e.preventDefault();
        handleRenameFile(file);
        break;
      case 'Delete':
        e.preventDefault();
        handleDeleteFile(file.id);
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        e.preventDefault();
        setIsKeyboardNav(true);
        const fileItems = Array.from(fileListRef.current?.querySelectorAll('.file-item') || []);
        const currentIndex = fileItems.findIndex(item => item.dataset.id === file.id);
        const nextIndex = e.key === 'ArrowDown' 
          ? Math.min(currentIndex + 1, fileItems.length - 1)
          : Math.max(currentIndex - 1, 0);
        
        if (nextIndex !== currentIndex && fileItems[nextIndex]) {
          const nextFileId = fileItems[nextIndex].dataset.id;
          const nextFile = files.find(f => f.id === nextFileId);
          if (nextFile) {
            setSelectedFile(nextFile);
            fileItems[nextIndex].focus();
          }
        }
        break;
      default:
        break;
    }
  }, [files, handleDeleteFile, handleRenameFile, mode, onOpenFile]);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = getFiles(currentUser.uid, (newFiles) => {
        if (isMountedRef.current) {
          setFiles(newFiles);
        }
      });
      return () => unsubscribe();
    } else {
      setFiles([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (mode === 'saveAs' && saveAsInputRef.current) {
      saveAsInputRef.current.focus();
      saveAsInputRef.current.select();
    }
  }, [mode]);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    const handleClick = () => {
      if (contextMenu && isMountedRef.current) {
        setContextMenu(null);
      }
      
      if (isKeyboardNav && isMountedRef.current) {
        setIsKeyboardNav(false);
      }
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu, isKeyboardNav]);

  const renderToolbar = useMemo(() => (
    <div className="explorer-toolbar">
      <div className="toolbar-buttons">
        <button 
          className="toolbar-button" 
          aria-label="Back"
          type="button"
          disabled
        >
          <span className="button-icon" aria-hidden="true">←</span>
          Back
        </button>
        <button 
          className="toolbar-button" 
          aria-label="Forward"
          type="button"
          disabled
        >
          <span className="button-icon" aria-hidden="true">→</span>
          Forward
        </button>
        <button 
          className="toolbar-button" 
          aria-label="Up"
          type="button"
          disabled
        >
          <span className="button-icon" aria-hidden="true">↑</span>
          Up
        </button>
        <div className="toolbar-separator" />
        {mode === 'browse' && (
          <button 
            className="toolbar-button" 
            onClick={handleCreateFile}
            aria-label="Create new text document"
            type="button"
          >
            <span className="button-icon" aria-hidden="true">📄</span>
            New Text Document
          </button>
        )}
      </div>
      <div className="address-bar">
        <span className="address-icon" aria-hidden="true">📁</span>
        <span className="address-text">My Documents</span>
      </div>
    </div>
  ), [mode, handleCreateFile]);

  const renderSaveAsBar = useMemo(() => (
    mode === 'saveAs' && (
      <div className="save-as-bar">
        <form onSubmit={handleSaveAs}>
          <label htmlFor="save-as-input">
            File name:
            <input
              ref={saveAsInputRef}
              id="save-as-input"
              type="text"
              value={saveAsFileName}
              onChange={(e) => setSaveAsFileName(e.target.value)}
              className="save-as-input"
              aria-label="File name input"
            />
          </label>
          <button type="submit" className="save-button">Save</button>
          <button 
            type="button" 
            className="cancel-button" 
            onClick={() => onSaveAs(null)}
          >
            Cancel
          </button>
        </form>
      </div>
    )
  ), [mode, saveAsFileName, handleSaveAs, onSaveAs]);

  const renderFileList = useCallback(() => (
    <div 
      className="files-container"
      onContextMenu={(e) => {
        e.stopPropagation();
        handleContextMenu(e, null);
      }}
      ref={fileListRef}
      role="list"
      aria-label="File list"
    >
      {!currentUser ? (
        <div className="login-prompt">
          <p>Sign in to view and manage your files</p>
          <button 
            onClick={signInWithGoogle} 
            className="login-button"
            aria-label="Sign in with Google"
            type="button"
          >
            Sign in with Google
          </button>
        </div>
      ) : files.length === 0 ? (
        <div className="empty-folder">
          <p>No files found. Create a new document to get started.</p>
        </div>
      ) : (
        files.map((file) => (
          <div 
            key={file.id}
            data-id={file.id}
            className={`file-item ${selectedFile?.id === file.id ? 'selected' : ''}`}
            onClick={() => {
              setSelectedFile(file);
              if (mode === 'saveAs') {
                setSaveAsFileName(file.name);
              } else {
                onOpenFile(file);
              }
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
              setSelectedFile(file);
              handleContextMenu(e, file);
            }}
            onKeyDown={(e) => handleKeyDown(e, file)}
            role="listitem"
            aria-selected={selectedFile?.id === file.id}
            tabIndex={0}
          >
            {isRenaming && selectedFile?.id === file.id ? (
              <form 
                onSubmit={handleRenameSubmit}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  ref={renameInputRef}
                  className="rename-input"
                  defaultValue={file.name.replace(/\.txt$/, '')}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      handleRenameCancel();
                    }
                  }}
                  aria-label="Rename file"
                />
              </form>
            ) : (
              <>
                <div className="file-icon" aria-hidden="true">📝</div>
                <span className="file-name">{file.name}</span>
              </>
            )}
          </div>
        ))
      )}
    </div>
  ), [
    currentUser, 
    files, 
    selectedFile, 
    isRenaming, 
    mode, 
    signInWithGoogle, 
    handleContextMenu, 
    handleKeyDown, 
    handleRenameSubmit, 
    handleRenameCancel, 
    onOpenFile
  ]);

  return (
    <div 
      className="file-explorer" 
      onContextMenu={(e) => handleContextMenu(e, null)}
      role="region"
      aria-label="File Explorer"
    >
      {renderToolbar}
      {renderSaveAsBar}
      
      <div className="explorer-content">
        <div className="sidebar">
          <div className="folder-tree" role="tree">
            <div className="tree-item active" role="treeitem" aria-selected="true" tabIndex={0}>
              <span aria-hidden="true">📁</span>My Documents
            </div>
          </div>
        </div>

        {renderFileList()}
      </div>

      <div className="status-bar" role="status">
        <div className="status-item">
          {currentUser ? `${files.length} object${files.length !== 1 ? 's' : ''}` : 'Not signed in'}
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={contextMenu.options}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
});

FileExplorer.displayName = 'FileExplorer';

export default FileExplorer; 