const STORAGE_KEY = 'os32.ai';

const DEFAULTS = {
  provider: 'claude',
  claudeApiKey: '',
  openaiApiKey: '',
  geminiApiKey: '',
  openrouterApiKey: '',
  claudeModel: 'claude-sonnet-4-6',
  openaiModel: 'gpt-4o',
  geminiModel: 'gemini-2.5-flash',
  openrouterModel: 'anthropic/claude-sonnet-4-6',
};

const MODELS = {
  claude: ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5-20251001'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro'],
  openrouter: [
    'anthropic/claude-sonnet-4-6',
    'anthropic/claude-opus-4-6',
    'openai/gpt-4o',
    'openai/o3-mini',
    'google/gemini-2.5-flash',
    'google/gemini-2.5-pro',
    'meta-llama/llama-4-maverick',
    'deepseek/deepseek-r2',
  ],
};

function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings(partial) {
  const current = loadSettings();
  const updated = { ...current, ...partial };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

function toGeminiContents(messages) {
  const systemMsg = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');
  const contents = chatMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  return { contents, systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : null };
}

function buildRequest(settings, messages, stream) {
  const { provider, claudeApiKey, openaiApiKey, geminiApiKey, openrouterApiKey,
    claudeModel, openaiModel, geminiModel, openrouterModel } = settings;

  if (provider === 'claude') {
    const systemMsg = messages.find(m => m.role === 'system');
    const filteredMessages = messages.filter(m => m.role !== 'system');
    return {
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: {
        model: claudeModel,
        max_tokens: 1024,
        stream,
        ...(systemMsg ? { system: systemMsg.content } : {}),
        messages: filteredMessages,
      },
    };
  }

  if (provider === 'gemini') {
    const { contents, systemInstruction } = toGeminiContents(messages);
    const endpoint = stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:${endpoint}&key=${geminiApiKey}`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        contents,
        ...(systemInstruction ? { systemInstruction } : {}),
        generationConfig: { maxOutputTokens: 1024 },
      },
    };
  }

  if (provider === 'openrouter') {
    return {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterApiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'OS32 Code Editor',
      },
      body: {
        model: openrouterModel,
        max_tokens: 1024,
        stream,
        messages,
      },
    };
  }

  return {
    url: 'https://api.openai.com/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: {
      model: openaiModel,
      max_tokens: 1024,
      stream,
      messages,
    },
  };
}

function getApiKey(settings) {
  if (settings.provider === 'claude') return settings.claudeApiKey;
  if (settings.provider === 'gemini') return settings.geminiApiKey;
  if (settings.provider === 'openrouter') return settings.openrouterApiKey;
  return settings.openaiApiKey;
}

async function streamChat(messages, { onChunk, onDone, onError }) {
  const settings = loadSettings();
  const { provider } = settings;

  const apiKey = getApiKey(settings);
  if (!apiKey) {
    onError(new Error('No API key configured. Go to AI → Settings to add your key.'));
    return;
  }

  const req = buildRequest(settings, messages, true);

  let response;
  try {
    response = await fetch(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify(req.body),
    });
  } catch (err) {
    onError(new Error(`Network error: ${err.message}`));
    return;
  }

  if (!response.ok) {
    let errText = '';
    try { errText = await response.text(); } catch { }
    onError(new Error(`API error ${response.status}: ${errText}`));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') { onDone(); return; }

        let parsed;
        try { parsed = JSON.parse(data); } catch { continue; }

        let delta = null;
        if (provider === 'claude') {
          if (parsed.type === 'content_block_delta') {
            delta = parsed.delta?.text ?? null;
          } else if (parsed.type === 'message_stop') {
            onDone();
            return;
          }
        } else if (provider === 'gemini') {
          delta = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
        } else {
          delta = parsed.choices?.[0]?.delta?.content ?? null;
        }

        if (delta) onChunk(delta);
      }
    }
  } catch (err) {
    onError(err);
    return;
  }

  onDone();
}

async function getCompletion({ prefix, suffix, language }, signal) {
  const settings = loadSettings();
  const { provider } = settings;

  const apiKey = getApiKey(settings);
  if (!apiKey) return '';

  const messages = [
    {
      role: 'system',
      content: 'You are a code completion assistant. Given a prefix and suffix, output only the code that should be inserted at the cursor. Return just the raw code with no explanation, no markdown, no backticks.',
    },
    {
      role: 'user',
      content: `Language: ${language}\n<prefix>${prefix}</prefix>\n<suffix>${suffix}</suffix>\n\nComplete the code at the cursor. Return only the inserted text.`,
    },
  ];

  const req = buildRequest(settings, messages, false);
  if (provider === 'gemini') {
    req.body.generationConfig.maxOutputTokens = 150;
  } else {
    req.body.max_tokens = 150;
    if (provider === 'openai' && settings.openaiModel === 'o3-mini') {
      req.body.max_completion_tokens = req.body.max_tokens;
      delete req.body.max_tokens;
    }
  }

  let response;
  try {
    response = await fetch(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify(req.body),
      signal,
    });
  } catch {
    return '';
  }

  if (!response.ok) return '';

  try {
    const json = await response.json();
    if (provider === 'claude') {
      return json.content?.[0]?.text?.trim() ?? '';
    } else if (provider === 'gemini') {
      return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    } else {
      return json.choices?.[0]?.message?.content?.trim() ?? '';
    }
  } catch {
    return '';
  }
}

async function testConnection() {
  const settings = loadSettings();
  const { provider } = settings;

  const apiKey = getApiKey(settings);
  if (!apiKey) return { ok: false, error: 'No API key provided.' };

  const messages = [{ role: 'user', content: 'Say "ok" and nothing else.' }];
  const req = buildRequest(settings, messages, false);
  if (provider === 'gemini') {
    req.body.generationConfig.maxOutputTokens = 10;
  } else {
    req.body.max_tokens = 10;
  }

  try {
    const response = await fetch(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      let errText = '';
      try { errText = await response.text(); } catch { }
      return { ok: false, error: `HTTP ${response.status}: ${errText}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

const aiService = { loadSettings, saveSettings, streamChat, getCompletion, testConnection, MODELS };
export default aiService;
