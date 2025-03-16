import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../firebase/AuthContext';
import { getFiles, createFile, deleteFile, updateFile } from '../../firebase/fileService';
import ContextMenu from './ContextMenu';
import './FileExplorer.css';

const FileExplorer = ({ onOpenFile }) => {
  const [files, setFiles] = useState([]);
  const { currentUser, signInWithGoogle } = useAuth();
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const renameInputRef = useRef(null);

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
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    // Add click handler to close context menu when clicking outside
    const handleClick = () => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

  const getNextFileName = () => {
    const baseFileName = "New Text Document";
    const existingNames = files.map(file => file.name);
    let counter = 0;
    let newFileName = `${baseFileName}.txt`;

    while (existingNames.includes(newFileName)) {
      counter++;
      newFileName = `${baseFileName} (${counter}).txt`;
    }

    return newFileName;
  };

  const handleCreateFile = () => {
    if (!currentUser) {
      const shouldLogin = window.confirm('You need to sign in to create files. Would you like to sign in now?');
      if (shouldLogin) {
        signInWithGoogle();
      }
      return;
    }

    const newFileName = getNextFileName();
    createFile(currentUser.uid, {
      name: newFileName,
      content: '',
      type: 'text',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    });
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedFile || !renameInputRef.current) return;

    const newName = renameInputRef.current.value.trim();
    if (newName && newName !== selectedFile.name) {
      try {
        await updateFile(currentUser.uid, selectedFile.id, {
          ...selectedFile,
          name: newName.endsWith('.txt') ? newName : `${newName}.txt`,
          modifiedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error renaming file:', error);
      }
    }
    setIsRenaming(false);
    setSelectedFile(null);
  };

  const handleRenameCancel = () => {
    setIsRenaming(false);
    setSelectedFile(null);
  };

  const handleDeleteFile = async (fileId) => {
    if (currentUser && window.confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteFile(currentUser.uid, fileId);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
  };

  const handleRenameFile = (file) => {
    setSelectedFile(file);
    setIsRenaming(true);
  };

  const handleContextMenu = (e, file = null) => {
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
  };

  return (
    <div className="file-explorer" onContextMenu={(e) => handleContextMenu(e, null)}>
      <div className="explorer-toolbar">
        <div className="toolbar-buttons">
          <button className="toolbar-button">
            <span className="button-icon">←</span>
            Back
          </button>
          <button className="toolbar-button">
            <span className="button-icon">→</span>
            Forward
          </button>
          <button className="toolbar-button">
            <span className="button-icon">↑</span>
            Up
          </button>
          <div className="toolbar-separator"></div>
          <button className="toolbar-button" onClick={handleCreateFile}>
            <span className="button-icon">📄</span>
            New Text Document
          </button>
        </div>
        <div className="address-bar">
          <span className="address-icon">📁</span>
          <span className="address-text">My Documents</span>
        </div>
      </div>

      <div className="explorer-content">
        <div className="sidebar">
          <div className="folder-tree">
            <div className="tree-item active">
              <span>📁My Documents</span>
            </div>
          </div>
        </div>

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
              <button onClick={signInWithGoogle} className="login-button">
                Sign in with Google
              </button>
            </div>
          ) : (
            files.map((file) => (
              <div 
                key={file.id}
                className={`file-item ${selectedFile?.id === file.id ? 'selected' : ''}`}
                onClick={() => onOpenFile(file)}
                onContextMenu={(e) => {
                  e.stopPropagation();
                  setSelectedFile(file);
                  handleContextMenu(e, file);
                }}
              >
                {isRenaming && selectedFile?.id === file.id ? (
                  <form 
                    onSubmit={handleRenameSubmit}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      ref={renameInputRef}
                      className="rename-input"
                      defaultValue={selectedFile.name.replace(/\.txt$/, '')}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={handleRenameSubmit}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          handleRenameCancel();
                        }
                      }}
                    />
                  </form>
                ) : (
                  <>
                    <div className="file-icon">📝</div>
                    <span className="file-name">{file.name}</span>
                  </>
                )}
              </div>
            ))
          )}
        </div>
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
};

export default FileExplorer; 