import React, { useState, useRef, useEffect, useCallback } from 'react';
import aiService from '../../services/aiService';

const SYSTEM_PROMPT = `You are an AI coding assistant built into a browser-based code editor.
Help the user understand, fix, and improve their code. Be concise and practical.`;

const AIPanel = ({ code, language, output, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  function buildApiMessages(userMessages) {
    return [
      { role: 'system', content: SYSTEM_PROMPT },
      ...userMessages.map(m => ({ role: m.role, content: m.content })),
    ];
  }

  const sendMessage = useCallback((content) => {
    if (!content.trim() || isStreaming) return;

    const userMsg = { role: 'user', content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);
    setStreamingText('');

    let accumulated = '';

    aiService.streamChat(buildApiMessages(newMessages), {
      onChunk: chunk => {
        accumulated += chunk;
        setStreamingText(accumulated);
      },
      onDone: () => {
        setMessages(prev => [...prev, { role: 'assistant', content: accumulated }]);
        setStreamingText('');
        setIsStreaming(false);
      },
      onError: err => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${err.message}`,
          isError: true,
        }]);
        setStreamingText('');
        setIsStreaming(false);
      },
    });
  }, [messages, isStreaming]);

  function handleQuickAction(action) {
    let prompt = '';
    if (action === 'explain') {
      prompt = `Explain this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``;
    } else if (action === 'fix') {
      prompt = `Fix errors in this ${language} code.\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`${output ? `\n\nOutput/errors:\n${output}` : ''}`;
    } else if (action === 'improve') {
      prompt = `Suggest improvements for this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``;
    }
    if (prompt) sendMessage(prompt);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleClear() {
    setMessages([]);
    setStreamingText('');
    setIsStreaming(false);
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <span className="ai-panel-title">AI Assistant</span>
        <div className="ai-panel-header-actions">
          <button className="ai-panel-clear-btn" onClick={handleClear} title="Clear chat">
            Clear
          </button>
          <button className="ai-panel-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>
      </div>

      <div className="ai-panel-actions">
        <button className="ai-quick-btn" onClick={() => handleQuickAction('explain')} disabled={isStreaming}>
          Explain Code
        </button>
        <button className="ai-quick-btn" onClick={() => handleQuickAction('fix')} disabled={isStreaming}>
          Fix Errors
        </button>
        <button className="ai-quick-btn" onClick={() => handleQuickAction('improve')} disabled={isStreaming}>
          Improve Code
        </button>
      </div>

      <div className="ai-panel-messages">
        {messages.length === 0 && !isStreaming && (
          <div className="ai-panel-empty">
            Ask a question or use a quick action above.
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`ai-message ai-message--${msg.role}${msg.isError ? ' ai-message--error' : ''}`}
          >
            <div className="ai-message-content">{msg.content}</div>
          </div>
        ))}
        {isStreaming && streamingText && (
          <div className="ai-message ai-message--assistant">
            <div className="ai-message-content">
              {streamingText}
              <span className="ai-cursor" />
            </div>
          </div>
        )}
        {isStreaming && !streamingText && (
          <div className="ai-message ai-message--assistant">
            <div className="ai-message-content ai-thinking">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-panel-input-area">
        <textarea
          className="ai-panel-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your code... (Enter to send)"
          rows={3}
          disabled={isStreaming}
        />
        <button
          className="ai-panel-send-btn"
          onClick={() => sendMessage(input)}
          disabled={isStreaming || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default AIPanel;
