import React, { useState, useCallback, useEffect, memo } from 'react';
import { 
  getInbox, 
  getSentEmails, 
  getArchivedEmails, 
  markAsRead, 
  archiveEmail, 
  deleteEmail, 
  sendEmail,
  getEmailById,
  getUserSuggestions
} from '../../firebase/emailService';
import { useAuth } from '../../firebase/AuthContext';
import './RetroEmail.css';

const DEFAULT_EMAIL_ICON = 'https://via.placeholder.com/16x16?text=@';

const RetroEmail = memo(({ onClose }) => {
  const { currentUser } = useAuth();
  const userEmail = currentUser?.email || '';
  
  const [activeMenu, setActiveMenu] = useState('inbox');
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // list, read, compose
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Redirect if user is not logged in
  useEffect(() => {
    if (!currentUser) {
      // Show error or redirect to login
      setError('Please log in to use the email feature');
    }
  }, [currentUser]);
  
  // Fetch emails based on active folder
  const fetchEmails = useCallback(async () => {
    if (!userEmail) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching emails for ${activeMenu} with user ${userEmail}`);
      let fetchedEmails = [];
      
      if (activeMenu === 'inbox') {
        fetchedEmails = await getInbox(userEmail);
      } else if (activeMenu === 'sent') {
        fetchedEmails = await getSentEmails(userEmail);
      } else if (activeMenu === 'archived') {
        fetchedEmails = await getArchivedEmails(userEmail);
      }
      
      console.log(`Fetched ${fetchedEmails.length} emails for ${activeMenu}`);
      setEmails(fetchedEmails);
      
      // Reset selected email if it's no longer in the fetched emails
      if (selectedEmail && !fetchedEmails.find(e => e.id === selectedEmail.id)) {
        setSelectedEmail(null);
        setViewMode('list');
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError('Failed to load emails. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [activeMenu, userEmail, selectedEmail]);
  
  useEffect(() => {
    if (['inbox', 'sent', 'archived'].includes(activeMenu)) {
      fetchEmails();
    }
  }, [activeMenu, fetchEmails, refreshTrigger]);
  
  // Handle main menu navigation
  const handleMenuClick = useCallback((menu) => {
    setActiveMenu(menu);
    setSelectedEmail(null);
    setViewMode('list');
  }, []);
  
  // Select an email to read
  const handleEmailSelect = useCallback(async (email) => {
    setSelectedEmail(email);
    setViewMode('read');
    
    // Mark as read if it's not already
    if (!email.read && email.to === userEmail) {
      try {
        await markAsRead(email.id);
      } catch (err) {
        console.error('Error marking email as read:', err);
      }
    }
  }, [userEmail]);
  
  // Archive currently viewed email
  const handleArchiveEmail = useCallback(async () => {
    if (!selectedEmail) return;
    
    setIsLoading(true);
    
    try {
      await archiveEmail(selectedEmail.id);
      setViewMode('list');
      setSelectedEmail(null);
      await fetchEmails();
    } catch (err) {
      setError('Failed to archive email');
      console.error('Error archiving email:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEmail, fetchEmails]);
  
  // Delete currently viewed email
  const handleDeleteEmail = useCallback(async () => {
    if (!selectedEmail) return;
    
    setIsLoading(true);
    
    try {
      await deleteEmail(selectedEmail.id);
      setViewMode('list');
      setSelectedEmail(null);
      await fetchEmails();
    } catch (err) {
      setError('Failed to delete email');
      console.error('Error deleting email:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEmail, fetchEmails]);
  
  // Handle compose form changes
  const handleComposeChange = useCallback((field, value) => {
    setComposeData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // If changing recipient, fetch user suggestions
    if (field === 'to' && value.trim()) {
      // Get user suggestions for autocomplete
      getUserSuggestions(value)
        .then(suggestions => {
          setUserSuggestions(suggestions);
          setShowSuggestions(suggestions.length > 0);
        })
        .catch(err => console.error('Error getting user suggestions:', err));
    } else if (field === 'to' && !value.trim()) {
      setShowSuggestions(false);
    }
  }, []);
  
  // Select a user suggestion
  const handleSelectSuggestion = useCallback((suggestion) => {
    setComposeData(prev => ({
      ...prev,
      to: suggestion.email
    }));
    setShowSuggestions(false);
  }, []);
  
  // Handle sending a new email
  const handleSendEmail = async () => {
    try {
      // Validate fields
      if (!composeData.to || !composeData.subject) {
        setError('Recipient and subject are required');
        return;
      }
      
      console.log('Sending email:', { from: userEmail, ...composeData });
      
      // Send email
      await sendEmail(userEmail, composeData.to, composeData.subject, composeData.body);
      
      console.log('Email sent successfully');
      
      // Clear form and switch back to previous view
      setComposeData({ to: '', subject: '', body: '' });
      setViewMode('list');
      
      // Refresh emails to show in sent folder
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error sending email:', error);
      setError('Failed to send email. Please try again.');
    }
  };

  // Handle new message button
  const handleNewMessage = useCallback(() => {
    setComposeData({ to: '', subject: '', body: '' });
    setViewMode('compose');
  }, []);

  // Handle reply button
  const handleReply = useCallback(() => {
    if (!selectedEmail) return;
    
    setComposeData({
      to: selectedEmail.from === userEmail ? selectedEmail.to : selectedEmail.from,
      subject: `RE: ${selectedEmail.subject}`,
      body: `\n\n----- Original Message -----\nFrom: ${selectedEmail.from}\nTo: ${selectedEmail.to}\nSent: ${new Date(selectedEmail.timestamp).toLocaleString()}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`
    });
    
    setViewMode('compose');
  }, [selectedEmail, userEmail]);
  
  // Format date for display
  const formatDate = useCallback((date) => {
    if (!date) return '';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const emailDate = new Date(date);
    const emailDay = new Date(emailDate.getFullYear(), emailDate.getMonth(), emailDate.getDate());
    
    if (emailDay.getTime() === today.getTime()) {
      return `Today, ${emailDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (emailDay.getTime() === yesterday.getTime()) {
      return `Yesterday, ${emailDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return emailDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }, []);
  
  // Render an email item in the list
  const renderEmailItem = useCallback((email) => (
    <div 
      key={email.id} 
      className={`email-item ${!email.read ? 'unread' : ''} ${selectedEmail && selectedEmail.id === email.id ? 'selected' : ''}`}
      onClick={() => handleEmailSelect(email)}
    >
      <div className="email-icon">
        <img src={DEFAULT_EMAIL_ICON} alt="" />
      </div>
      <div className="email-info">
        <div className="email-sender">{email.from === userEmail ? `To: ${email.to}` : email.from}</div>
        <div className="email-subject">{email.subject}</div>
        <div className="email-preview">{email.body.substring(0, 40)}...</div>
        <div className="email-date">{formatDate(email.timestamp)}</div>
      </div>
    </div>
  ), [handleEmailSelect, formatDate, userEmail, selectedEmail]);
  
  // Add a refresh button handler
  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    fetchEmails();
  }, [fetchEmails]);
  
  return (
    <div className="react-mail-container">
      <div className="react-mail-header">
        <h2>Windows Mail</h2>
        <button className="close-button" onClick={onClose}>X</button>
      </div>
      
      <div className="react-mail-toolbar">
        <button className="toolbar-button" onClick={handleNewMessage}>
          <span className="toolbar-icon">✉️</span>
          <span className="toolbar-text">Create Mail</span>
        </button>
        
        <button className="toolbar-button" onClick={handleReply} disabled={viewMode !== 'read'}>
          <span className="toolbar-icon">↩️</span>
          <span className="toolbar-text">Reply</span>
        </button>
        
        <button className="toolbar-button" onClick={handleDeleteEmail} disabled={viewMode !== 'read'}>
          <span className="toolbar-icon">🗑️</span>
          <span className="toolbar-text">Delete</span>
        </button>
        
        <button className="toolbar-button" onClick={handleSendEmail} disabled={viewMode !== 'compose'}>
          <span className="toolbar-icon">📤</span>
          <span className="toolbar-text">Send</span>
        </button>
        
        <div className="toolbar-separator"></div>
        
        <button className="toolbar-button" onClick={handleRefresh}>
          <span className="toolbar-icon">🔄</span>
          <span className="toolbar-text">Refresh</span>
        </button>
      </div>
      
      <div className="react-mail-content">
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <div>Loading...</div>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
            <button onClick={() => setError(null)}>OK</button>
          </div>
        )}
        
        <div className="react-mail-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-header">Windows Mail</div>
            <div className={`sidebar-item ${activeMenu === 'inbox' ? 'active' : ''}`} onClick={() => handleMenuClick('inbox')}>
              <span className="sidebar-icon">📥</span>
              <span>Inbox</span>
            </div>
            <div className={`sidebar-item ${activeMenu === 'sent' ? 'active' : ''}`} onClick={() => handleMenuClick('sent')}>
              <span className="sidebar-icon">📤</span>
              <span>Sent Items</span>
            </div>
            <div className={`sidebar-item ${activeMenu === 'archived' ? 'active' : ''}`} onClick={() => handleMenuClick('archived')}>
              <span className="sidebar-icon">🗃️</span>
              <span>Archived</span>
            </div>
            <div className="sidebar-item">
              <span className="sidebar-icon">📝</span>
              <span>Drafts</span>
            </div>
            <div className="sidebar-item">
              <span className="sidebar-icon">🗑️</span>
              <span>Deleted Items</span>
            </div>
          </div>
          
          <div className="sidebar-section">
            <div className="sidebar-header">Contacts</div>
            <div className="sidebar-item">
              <span className="sidebar-icon">👤</span>
              <span>Address Book</span>
            </div>
          </div>
        </div>
        
        <div className="react-mail-main">
          {/* List View */}
          {viewMode === 'list' && (
            <div className="email-list-view">
              <div className="list-header">
                <div className="list-header-sender">From</div>
                <div className="list-header-subject">Subject</div>
                <div className="list-header-date">Received</div>
              </div>
              
              <div className="email-list">
                {emails.length === 0 ? (
                  <div className="empty-state">
                    <p>No messages in this folder</p>
                  </div>
                ) : (
                  emails.map(renderEmailItem)
                )}
              </div>
            </div>
          )}
          
          {/* Read Email View */}
          {viewMode === 'read' && selectedEmail && (
            <div className="read-email-view">
              <div className="email-header-info">
                <div className="email-subject-line">{selectedEmail.subject}</div>
                <div className="email-metadata">
                  <div><strong>From:</strong> {selectedEmail.from}</div>
                  <div><strong>To:</strong> {selectedEmail.to}</div>
                  <div><strong>Date:</strong> {formatDate(selectedEmail.timestamp)}</div>
                </div>
              </div>
              
              <div className="email-body">
                {selectedEmail.body.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}
          
          {/* Compose Email View */}
          {viewMode === 'compose' && (
            <div className="compose-email-view">
              <div className="compose-form">
                <div className="compose-field">
                  <label>To:</label>
                  <input 
                    type="email" 
                    value={composeData.to}
                    onChange={(e) => handleComposeChange('to', e.target.value)}
                    placeholder="recipient@example.com"
                  />
                  {showSuggestions && (
                    <div className="user-suggestions">
                      {userSuggestions.map((suggestion) => (
                        <div 
                          key={suggestion.email} 
                          className="suggestion-item"
                          onClick={() => handleSelectSuggestion(suggestion)}
                        >
                          <div className="suggestion-name">{suggestion.name}</div>
                          <div className="suggestion-email">{suggestion.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="compose-field">
                  <label>Subject:</label>
                  <input 
                    type="text" 
                    value={composeData.subject}
                    onChange={(e) => handleComposeChange('subject', e.target.value)}
                    placeholder="Subject"
                  />
                </div>
                
                <div className="compose-field compose-body">
                  <textarea 
                    value={composeData.body}
                    onChange={(e) => handleComposeChange('body', e.target.value)}
                    placeholder="Type your message here..."
                    rows={15}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="react-mail-status-bar">
        <div style={{ flex: 1 }}>
          {activeMenu === 'inbox' && `${emails.length} message(s)`}
        </div>
        <div>Logged in as: {userEmail}</div>
      </div>
    </div>
  );
});

RetroEmail.displayName = 'RetroEmail';

export default RetroEmail; 