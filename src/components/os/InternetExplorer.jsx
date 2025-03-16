import React, { useState, useRef, useEffect } from 'react';
import './InternetExplorer.css';

const InternetExplorer = () => {
  const [url, setUrl] = useState('https://som1shi.github.io');
  const [displayUrl, setDisplayUrl] = useState('https://som1shi.github.io');
  const [history, setHistory] = useState(['https://som1shi.github.io']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const iframeRef = useRef(null);

  const handleUrlChange = (e) => {
    setDisplayUrl(e.target.value);
  };

  const navigateTo = (newUrl) => {
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      newUrl = 'https://' + newUrl;
    }
    
    setIsLoading(true);
    setLoadError(false);
    setUrl(newUrl);
    setDisplayUrl(newUrl);
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigateTo(displayUrl);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setUrl(history[historyIndex - 1]);
      setDisplayUrl(history[historyIndex - 1]);
      setIsLoading(true);
      setLoadError(false);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setUrl(history[historyIndex + 1]);
      setDisplayUrl(history[historyIndex + 1]);
      setIsLoading(true);
      setLoadError(false);
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setLoadError(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setLoadError(true);
        setIsLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isLoading, url]);

  const refresh = () => {
    setIsLoading(true);
    setLoadError(false);
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
  };

  const home = () => {
    navigateTo('https://html5test.com');
  };

  const renderContent = () => {
    if (loadError) {
      return (
        <div className="ie-error">
          <div className="ie-error-icon">❌</div>
          <h3>This page can't be displayed</h3>
          <p>Due to security restrictions, many websites (including Google) cannot be displayed in an iframe.</p>
          <p>Try visiting one of these sites that work with iframes:</p>
          <ul>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('https://html5test.com'); }}>HTML5 Test</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('https://www.wikipedia.org'); }}>Wikipedia</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('https://archive.org'); }}>Internet Archive</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('https://www.w3.org'); }}>W3C</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('https://css-tricks.com'); }}>CSS-Tricks</a></li>
          </ul>
          <p className="ie-error-note">Note: Many modern websites use X-Frame-Options headers to prevent being loaded in iframes for security reasons.</p>
          <button onClick={refresh} className="ie-retry-button">Try Again</button>
        </div>
      );
    }

    return (
      <iframe
        ref={iframeRef}
        src={url}
        title="Internet Explorer"
        className="ie-iframe"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    );
  };

  return (
    <div className="internet-explorer">
      <div className="ie-toolbar">
        <div className="ie-buttons">
          <button onClick={goBack} disabled={historyIndex === 0}>Back</button>
          <button onClick={goForward} disabled={historyIndex === history.length - 1}>Forward</button>
          <button onClick={refresh}>Refresh</button>
          <button onClick={home}>Home</button>
        </div>
        <form onSubmit={handleSubmit} className="ie-address-bar">
          <span className="ie-address-label">Address:</span>
          <input 
            type="text" 
            value={displayUrl} 
            onChange={handleUrlChange} 
            className="ie-url-input"
          />
          <button type="submit" className="ie-go-button">Go</button>
        </form>
      </div>
      
      <div className="ie-content">
        {isLoading && <div className="ie-loading">Loading...</div>}
        {renderContent()}
      </div>
      
      <div className="ie-statusbar">
        <div className="ie-status">
          {isLoading ? 'Loading...' : loadError ? 'Error loading page' : 'Done'}
        </div>
      </div>
    </div>
  );
};

export default InternetExplorer; 