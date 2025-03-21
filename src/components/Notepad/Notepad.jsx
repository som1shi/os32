import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { useAuth } from '../../firebase/AuthContext';
import { createFile, updateFile } from '../../firebase/fileService';
import FileExplorer from '../FileExplorer/FileExplorer';
import './Notepad.css';

const FILE_EXTENSION = '.txt';
const DEFAULT_FILE_NAME = 'Untitled.txt';
const ERROR_MESSAGES = {
  SIGN_IN_REQUIRED: 'Please sign in to save files.',
  SAVE_FAILED: 'Failed to save file. Please try again.',
  EMPTY_FILENAME: 'Please enter a file name',
  UNSAVED_CHANGES: 'Do you want to save changes?'
};

const Notepad = memo(({ file: initialFile, onClose }) => {
  const [content, setContent] = useState(initialFile?.content || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(!initialFile);
  const [currentFile, setCurrentFile] = useState(initialFile);
  const { currentUser } = useAuth();
  
  const editorRef = useRef(null);
  const isInitialMount = useRef(true);
  const isMountedRef = useRef(true);

  const getCurrentContent = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      return content || '';
    }
    return content;
  }, [content]);

  const validateFileName = useCallback((fileName) => {
    if (!fileName?.trim()) {
      throw new Error(ERROR_MESSAGES.EMPTY_FILENAME);
    }
    let validFileName = fileName.trim();
    if (!validFileName.toLowerCase().endsWith(FILE_EXTENSION)) {
      validFileName += FILE_EXTENSION;
    }
    return validFileName;
  }, []);

  const handleFormat = useCallback((command) => {
    if (editorRef.current) {
      try {
        editorRef.current.focus();
        document.execCommand(command, false, null);
        setHasUnsavedChanges(true);
      } catch (error) {
        console.error(`Error applying format ${command}:`, error);
      }
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!currentUser) {
      alert(ERROR_MESSAGES.SIGN_IN_REQUIRED);
      return;
    }

    if (!currentFile) {
      if (editorRef.current) {
        const currentContent = editorRef.current.innerHTML;
        setContent(currentContent);
      }
      setShowSaveDialog(true);
      return;
    }

    try {
      const newContent = getCurrentContent();
      await updateFile(currentUser.uid, currentFile.id, {
        ...currentFile,
        content: newContent,
        modifiedAt: new Date().toISOString()
      });
      if (isMountedRef.current) {
        setContent(newContent);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error saving file:', error);
      if (isMountedRef.current) {
        alert(ERROR_MESSAGES.SAVE_FAILED);
      }
    }
  }, [currentUser, currentFile, getCurrentContent]);

  const handleShowSaveDialog = useCallback(() => {
    if (editorRef.current) {
      const currentContent = editorRef.current.innerHTML;
      setContent(currentContent);
    }
    setShowSaveDialog(true);
  }, []);

  const handleSaveAs = useCallback(async (fileName, contentFromDialog) => {
    if (!fileName) {
      setShowSaveDialog(false);
      return;
    }

    if (!currentUser) {
      alert(ERROR_MESSAGES.SIGN_IN_REQUIRED);
      return;
    }

    try {
      const validFileName = validateFileName(fileName);
      const contentToSave = contentFromDialog || (editorRef.current ? editorRef.current.innerHTML : content);
      
      const newFile = await createFile(currentUser.uid, {
        name: validFileName,
        content: contentToSave,
        type: 'text',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      });

      if (isMountedRef.current) {
        setCurrentFile(newFile);
        setContent(contentToSave);
        setHasUnsavedChanges(false);
        setShowSaveDialog(false);
      }
    } catch (error) {
      console.error('Error saving file:', error);
      if (isMountedRef.current) {
        alert(error.message || ERROR_MESSAGES.SAVE_FAILED);
      }
    }
  }, [currentUser, validateFileName, content]);

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      const shouldSave = window.confirm(ERROR_MESSAGES.UNSAVED_CHANGES);
      if (shouldSave) {
        handleSave();
        return;
      }
    }
    onClose();
  }, [hasUnsavedChanges, handleSave, onClose]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      setHasUnsavedChanges(true);
    }
  }, []);

  const menuItems = useMemo(() => {
    const fileMenu = [
      { label: 'Save', onClick: handleSave, shortcut: 'Ctrl+S' },
      { label: 'Save As...', onClick: handleShowSaveDialog },
      { type: 'separator' },
      { label: 'Exit', onClick: handleClose }
    ];

    const formatMenu = [
      { label: 'Bold (Ctrl+B)', onClick: () => handleFormat('bold') },
      { label: 'Underline (Ctrl+U)', onClick: () => handleFormat('underline') }
    ];

    return { fileMenu, formatMenu };
  }, [handleSave, handleShowSaveDialog, handleClose, handleFormat]);

  useEffect(() => {
    isMountedRef.current = true;
    
    const handleKeyCommand = (e) => {
      if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            handleFormat('bold');
            break;
          case 'u':
            e.preventDefault();
            handleFormat('underline');
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyCommand);
    return () => {
      isMountedRef.current = false;
      document.removeEventListener('keydown', handleKeyCommand);
    };
  }, [handleFormat, handleSave]);

  useEffect(() => {
    if (editorRef.current && isInitialMount.current) {
      editorRef.current.innerHTML = content;
      isInitialMount.current = false;
      
      editorRef.current.focus();
    }
  }, [content]);

  const lastModifiedText = useMemo(() => {
    if (!currentFile) return '';
    return `Last modified: ${new Date(currentFile.modifiedAt).toLocaleString()}`;
  }, [currentFile]);

  const renderEditor = useCallback(() => (
    <div className="editor-container">
      <div
        ref={editorRef}
        className="editor"
        contentEditable
        onInput={handleInput}
        spellCheck={false}
        role="textbox"
        aria-multiline="true"
        aria-label="Notepad editor"
        tabIndex={0}
      />
    </div>
  ), [handleInput]);

  const renderMenuBar = useCallback(() => (
    <div className="menu-bar" role="menubar">
      <div className="menu-item" role="menuitem" aria-haspopup="true">
        <span>File</span>
        <div className="menu-dropdown" role="menu">
          {menuItems.fileMenu.map((item, index) => (
            item.type === 'separator' ? (
              <div key={`file-sep-${index}`} className="menu-separator" role="separator" />
            ) : (
              <button 
                key={`file-${index}`} 
                onClick={item.onClick}
                role="menuitem"
                type="button"
              >
                {item.label}
              </button>
            )
          ))}
        </div>
      </div>
      <div className="menu-item" role="menuitem" aria-haspopup="true">
        <span>Format</span>
        <div className="menu-dropdown" role="menu">
          {menuItems.formatMenu.map((item, index) => (
            <button 
              key={`format-${index}`} 
              onClick={item.onClick}
              role="menuitem"
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  ), [menuItems]);

  const renderStatusBar = useCallback(() => (
    <div className="status-bar" role="status">
      <div className="status-item">
        {hasUnsavedChanges ? 'Unsaved Changes' : 'Saved'}
      </div>
      <div className="status-item">
        {lastModifiedText}
      </div>
    </div>
  ), [hasUnsavedChanges, lastModifiedText]);

  if (showSaveDialog) {
    return (
      <>
        <div className="notepad-content">
          {renderMenuBar()}
          {renderEditor()}
          {renderStatusBar()}
        </div>
        <div className="save-dialog-overlay" role="dialog" aria-label="Save As Dialog">
          <div className="save-dialog">
            <div className="save-dialog-title">Save As</div>
            <FileExplorer
              mode="saveAs"
              onSaveAs={handleSaveAs}
              initialFileName={currentFile?.name || DEFAULT_FILE_NAME}
              currentContent={editorRef.current ? editorRef.current.innerHTML : content}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="notepad-content">
      {renderMenuBar()}
      {renderEditor()}
      {renderStatusBar()}
    </div>
  );
});

Notepad.displayName = 'Notepad';

export default Notepad; 