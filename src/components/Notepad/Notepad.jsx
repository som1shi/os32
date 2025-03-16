import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../firebase/AuthContext';
import { updateFile } from '../../firebase/fileService';
import './Notepad.css';

const Notepad = ({ file, onClose }) => {
  const [content, setContent] = useState(file.content || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { currentUser } = useAuth();
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  }, []);

  const handleFormat = (command) => {
    if (editorRef.current) {
      editorRef.current.focus();
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        document.execCommand(command, false, null);
        setHasUnsavedChanges(true);
      }
    }
  };

  const handleSave = () => {
    if (currentUser && editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      updateFile(currentUser.uid, file.id, {
        ...file,
        content: newContent,
        modifiedAt: new Date().toISOString()
      });
      setContent(newContent);
      setHasUnsavedChanges(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const shouldSave = window.confirm('Do you want to save changes to ' + file.name + '?');
      if (shouldSave) {
        handleSave();
      }
    }
    onClose();
  };

  const handleInput = () => {
    if (editorRef.current) {
      setHasUnsavedChanges(true);
    }
  };

  const handleKeyCommand = (e) => {
    if (e.ctrlKey || e.metaKey) {
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

  return (
    <div className="notepad-content">
      <div className="menu-bar">
        <div className="menu-item">
          <span>File</span>
          <div className="menu-dropdown">
            <div className="menu-option" onClick={handleSave}>Save (Ctrl+S)</div>
            <div className="menu-separator"></div>
            <div className="menu-option" onClick={handleClose}>Exit</div>
          </div>
        </div>
        <div className="menu-item">
          <span>Format</span>
          <div className="menu-dropdown">
            <div className="menu-option" onClick={() => handleFormat('bold')}>
              Bold (Ctrl+B)
            </div>
            <div className="menu-option" onClick={() => handleFormat('underline')}>
              Underline (Ctrl+U)
            </div>
          </div>
        </div>
      </div>

      <div className="editor-container">
        <div
          ref={editorRef}
          className="editor"
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyCommand}
          spellCheck={false}
        />
      </div>

      <div className="status-bar">
        <div className="status-item">
          {hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
        </div>
        <div className="status-item">
          Last modified: {new Date(file.modifiedAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default Notepad; 