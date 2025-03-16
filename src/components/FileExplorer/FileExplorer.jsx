import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
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
  ERROR_DELETE: 'Error deleting file:'
};

const FileExplorer = memo(({ onOpenFile, mode = 'browse', onSaveAs = null, initialFileName = '' }) => {
  const [files, setFiles] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [saveAsFileName, setSaveAsFileName] = useState(initialFileName);

  const { currentUser, signInWithGoogle } = useAuth();

  const renameInputRef = useRef(null);
  const saveAsInputRef = useRef(null);

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
    const trimmedName = name.trim();
    if (!trimmedName) return null;
    return trimmedName.endsWith(FILE_EXTENSION) ? trimmedName : `${trimmedName}${FILE_EXTENSION}`;
  }, []);

  const handleCreateFile = useCallback(async () => {
    if (!currentUser) {
      const shouldLogin = window.confirm(ERROR_MESSAGES.SIGN_IN_PROMPT);
      if (shouldLogin) {
        await signInWithGoogle();
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

    const newName = validateFileName(renameInputRef.current.value);
    if (newName && newName !== selectedFile.name) {
      try {
        await updateFile(currentUser.uid, selectedFile.id, {
          ...selectedFile,
          name: newName,
          modifiedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error(ERROR_MESSAGES.ERROR_RENAME, error);
      }
    }
    setIsRenaming(false);
    setSelectedFile(null);
  }, [selectedFile, currentUser, validateFileName]);

  const handleRenameCancel = useCallback(() => {
    setIsRenaming(false);
    setSelectedFile(null);
  }, []);

  const handleDeleteFile = useCallback(async (fileId) => {
    if (!currentUser || !window.confirm(ERROR_MESSAGES.DELETE_CONFIRM)) return;

    try {
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

    const fileName = validateFileName(saveAsFileName);
    if (!fileName) return;

    if (files.some(file => file.name === fileName)) {
      const overwrite = window.confirm(ERROR_MESSAGES.FILE_EXISTS);
      if (!overwrite) return;
    }

    await onSaveAs(fileName);
  }, [currentUser, files, onSaveAs, saveAsFileName, validateFileName]);

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

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = getFiles(currentUser.uid, (newFiles) => {
        setFiles(newFiles);
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
    const handleClick = () => contextMenu && setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);
  
  const renderToolbar = () => (
    <div className="explorer-toolbar">
      <div className="toolbar-buttons">
        <button className="toolbar-button" aria-label="Back">
          <span className="button-icon">←</span>
          Back
        </button>
        <button className="toolbar-button" aria-label="Forward">
          <span className="button-icon">→</span>
          Forward
        </button>
        <button className="toolbar-button" aria-label="Up">
          <span className="button-icon">↑</span>
          Up
        </button>
        <div className="toolbar-separator" />
        {mode === 'browse' && (
          <button 
            className="toolbar-button" 
            onClick={handleCreateFile}
            aria-label="Create new text document"
          >
            <span className="button-icon">📄</span>
            New Text Document
          </button>
        )}
      </div>
      <div className="address-bar">
        <span className="address-icon" aria-hidden="true">📁</span>
        <span className="address-text">My Documents</span>
      </div>
    </div>
  );

  const renderSaveAsBar = () => (
    mode === 'saveAs' && (
      <div className="save-as-bar">
        <form onSubmit={handleSaveAs}>
          <label>
            File name:
            <input
              ref={saveAsInputRef}
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
  );

  const renderFileList = () => (
    <div 
      className="files-container"
      onContextMenu={(e) => {
        e.stopPropagation();
        handleContextMenu(e, null);
      }}
    >
      {!currentUser ? (
        <div className="login-prompt">
          <p>Sign in to view and manage your files</p>
          <button 
            onClick={signInWithGoogle} 
            className="login-button"
            aria-label="Sign in with Google"
          >
            Sign in with Google
          </button>
        </div>
      ) : (
        files.map((file) => (
          <div 
            key={file.id}
            className={`file-item ${selectedFile?.id === file.id ? 'selected' : ''}`}
            onClick={() => mode === 'saveAs' ? setSaveAsFileName(file.name) : onOpenFile(file)}
            onContextMenu={(e) => {
              e.stopPropagation();
              setSelectedFile(file);
              handleContextMenu(e, file);
            }}
            role="button"
            aria-label={file.name}
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
  );

  return (
    <div 
      className="file-explorer" 
      onContextMenu={(e) => handleContextMenu(e, null)}
      role="region"
      aria-label="File Explorer"
    >
      {renderToolbar()}
      {renderSaveAsBar()}
      
      <div className="explorer-content">
        <div className="sidebar">
          <div className="folder-tree">
            <div className="tree-item active">
              <span>📁My Documents</span>
            </div>
          </div>
        </div>

        {renderFileList()}
      </div>

      <div className="status-bar">
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