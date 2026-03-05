import React, { useState } from 'react';
import aiService from '../../services/aiService';

const PROVIDER_LABELS = {
  claude: 'Anthropic',
  openai: 'OpenAI',
  gemini: 'Google AI',
  openrouter: 'OpenRouter',
};

function getModelKey(provider) {
  return { claude: 'claudeModel', openai: 'openaiModel', gemini: 'geminiModel', openrouter: 'openrouterModel' }[provider] || 'openaiModel';
}

function getApiKeyField(provider) {
  return { claude: 'claudeApiKey', openai: 'openaiApiKey', gemini: 'geminiApiKey', openrouter: 'openrouterApiKey' }[provider] || 'openaiApiKey';
}

const AISettings = ({ onClose, onSave }) => {
  const [settings, setSettings] = useState(aiService.loadSettings());
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  const { provider } = settings;
  const currentKey = settings[getApiKeyField(provider)] || '';
  const currentModel = settings[getModelKey(provider)] || '';
  const models = aiService.MODELS[provider] || [];
  const isOpenRouter = provider === 'openrouter';

  function handleProviderChange(e) {
    const p = e.target.value;
    const defaultModel = aiService.MODELS[p]?.[0] || '';
    setSettings(s => ({ ...s, provider: p, [getModelKey(p)]: s[getModelKey(p)] || defaultModel }));
    setTestStatus(null);
  }

  function handleModelChange(e) {
    setSettings(s => ({ ...s, [getModelKey(provider)]: e.target.value }));
  }

  function handleKeyChange(e) {
    setSettings(s => ({ ...s, [getApiKeyField(provider)]: e.target.value }));
    setTestStatus(null);
  }

  async function handleTest() {
    setTestStatus('testing');
    const saved = aiService.loadSettings();
    aiService.saveSettings(settings);
    const result = await aiService.testConnection();
    if (!result.ok) aiService.saveSettings(saved);
    setTestStatus(result.ok ? 'ok' : { error: result.error });
  }

  function handleSave() {
    aiService.saveSettings(settings);
    if (onSave) onSave();
    onClose();
  }

  return (
    <div className="ai-settings-overlay">
      <div className="ai-settings-dialog">
        <div className="ai-settings-title">AI Assistant Settings</div>
        <div className="ai-settings-body">
          <div className="ai-settings-row">
            <label className="ai-settings-label">Provider</label>
            <select className="ai-settings-select" value={provider} onChange={handleProviderChange}>
              <option value="claude">Claude (Anthropic)</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Gemini (Google)</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </div>

          <div className="ai-settings-row">
            <label className="ai-settings-label">Model</label>
            {isOpenRouter ? (
              <input
                className="ai-settings-input ai-settings-select"
                type="text"
                value={currentModel}
                onChange={handleModelChange}
                placeholder="e.g. anthropic/claude-sonnet-4-6"
                spellCheck={false}
                list="openrouter-models"
              />
            ) : (
              <select className="ai-settings-select" value={currentModel} onChange={handleModelChange}>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
            {isOpenRouter && (
              <datalist id="openrouter-models">
                {models.map(m => <option key={m} value={m} />)}
              </datalist>
            )}
          </div>

          {isOpenRouter && (
            <div className="ai-settings-hint" style={{ marginTop: 0 }}>
              Any model slug from openrouter.ai/models works (e.g. <em>meta-llama/llama-4-maverick</em>).
            </div>
          )}

          <div className="ai-settings-row">
            <label className="ai-settings-label">API Key</label>
            <div className="ai-settings-key-row">
              <input
                className="ai-settings-input"
                type={showKey ? 'text' : 'password'}
                value={currentKey}
                onChange={handleKeyChange}
                placeholder={`Your ${PROVIDER_LABELS[provider]} API key`}
                spellCheck={false}
              />
              <button className="xp-button ai-settings-show-btn" onClick={() => setShowKey(v => !v)}>
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {testStatus && (
            <div className={`ai-settings-test-status ${testStatus === 'ok' ? 'ok' : testStatus === 'testing' ? 'testing' : 'error'}`}>
              {testStatus === 'testing' && 'Testing connection...'}
              {testStatus === 'ok' && 'Connection successful!'}
              {testStatus?.error && `Error: ${testStatus.error}`}
            </div>
          )}

          <div className="ai-settings-hint">
            Your API key is stored only in your browser's localStorage and never sent to our servers.
          </div>
        </div>

        <div className="ai-settings-footer">
          <button className="xp-button" onClick={handleTest} disabled={testStatus === 'testing'}>
            Test Connection
          </button>
          <div className="ai-settings-footer-right">
            <button className="xp-button xp-button-primary" onClick={handleSave}>Save</button>
            <button className="xp-button" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISettings;
