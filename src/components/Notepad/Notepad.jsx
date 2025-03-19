import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
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
      setContent(newContent);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving file:', error);
      alert(ERROR_MESSAGES.SAVE_FAILED);
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

      setCurrentFile(newFile);
      setContent(contentToSave);
      setHasUnsavedChanges(false);
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Error saving file:', error);
      alert(error.message || ERROR_MESSAGES.SAVE_FAILED);
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

  useEffect(() => {
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
    return () => document.removeEventListener('keydown', handleKeyCommand);
  }, [handleFormat, handleSave]);

  useEffect(() => {
    if (editorRef.current && isInitialMount.current) {
      editorRef.current.innerHTML = content;
      isInitialMount.current = false;
    }
  }, [content]);

  if (showSaveDialog) {
    return (
      <>
        <div className="notepad-content">
          <div className="menu-bar">
            <div className="menu-item">
              <span>File</span>
              <div className="menu-dropdown">
                <button onClick={handleSave}>Save</button>
                <button onClick={handleShowSaveDialog}>Save As...</button>
                <div className="menu-separator" />
                <button onClick={handleClose}>Exit</button>
              </div>
            </div>
            <div className="menu-item">
              <span>Format</span>
              <div className="menu-dropdown">
                <button onClick={() => handleFormat('bold')}>
                  Bold (Ctrl+B)
                </button>
                <button onClick={() => handleFormat('underline')}>
                  Underline (Ctrl+U)
                </button>
              </div>
            </div>
          </div>

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
            />
          </div>

          <div className="status-bar">
            <div className="status-item">
              {hasUnsavedChanges ? 'Unsaved Changes' : 'Saved'}
            </div>
            <div className="status-item">
              {currentFile && `Last modified: ${new Date(currentFile.modifiedAt).toLocaleString()}`}
            </div>
          </div>
        </div>
        <div className="save-dialog-overlay">
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
      <div className="menu-bar">
        <div className="menu-item">
          <span>File</span>
          <div className="menu-dropdown">
            <button onClick={handleSave}>Save</button>
            <button onClick={handleShowSaveDialog}>Save As...</button>
            <div className="menu-separator" />
            <button onClick={handleClose}>Exit</button>
          </div>
        </div>
        <div className="menu-item">
          <span>Format</span>
          <div className="menu-dropdown">
            <button onClick={() => handleFormat('bold')}>
              Bold (Ctrl+B)
            </button>
            <button onClick={() => handleFormat('underline')}>
              Underline (Ctrl+U)
            </button>
          </div>
        </div>
      </div>

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
        />
      </div>

      <div className="status-bar">
        <div className="status-item">
          {hasUnsavedChanges ? 'Unsaved Changes' : 'Saved'}
        </div>
        <div className="status-item">
          {currentFile && `Last modified: ${new Date(currentFile.modifiedAt).toLocaleString()}`}
        </div>
      </div>
    </div>
  );
});

Notepad.displayName = 'Notepad';

export default Notepad; 