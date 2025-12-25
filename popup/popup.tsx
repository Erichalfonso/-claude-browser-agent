import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AgentStatus {
  running: boolean;
  currentAction?: string;
  progress?: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<AgentStatus>({ running: false });
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load API key from storage
    chrome.storage.local.get(['claudeApiKey'], (result) => {
      if (result.claudeApiKey) {
        setApiKey(result.claudeApiKey);
      }
    });

    // Listen for status updates from background
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'status_update') {
        setStatus(message.status);
      } else if (message.type === 'agent_message') {
        addMessage('assistant', message.content);
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant' | 'system', content: string) => {
    setMessages(prev => [...prev, { role, content, timestamp: new Date() }]);
  };

  const handleSend = async () => {
    if (!input.trim() || !apiKey) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);

    // Send to background script
    chrome.runtime.sendMessage({
      type: 'run_agent',
      goal: userMessage,
      apiKey: apiKey
    });
  };

  const handleStop = () => {
    chrome.runtime.sendMessage({ type: 'stop_agent' });
    setStatus({ running: false });
  };

  const saveApiKey = () => {
    chrome.storage.local.set({ claudeApiKey: apiKey });
    setShowSettings(false);
    addMessage('system', 'API key saved successfully');
  };

  return (
    <div className="app">
      <div className="header">
        <h1>Claude Browser Agent</h1>
        <button onClick={() => setShowSettings(!showSettings)} className="settings-btn">
          ⚙️
        </button>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <h3>Settings</h3>
          <label>
            Claude API Key:
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
            />
          </label>
          <button onClick={saveApiKey}>Save</button>
          <button onClick={() => setShowSettings(false)}>Cancel</button>
        </div>
      )}

      {status.running && (
        <div className="status-bar">
          <div className="spinner"></div>
          <div className="status-text">
            <div className="status-action">{status.currentAction || 'Thinking...'}</div>
            {status.progress && <div className="status-progress">{status.progress}</div>}
          </div>
          <button onClick={handleStop} className="stop-btn">Stop</button>
        </div>
      )}

      <div className="messages">
        {messages.length === 0 && (
          <div className="welcome">
            <h2>👋 Welcome!</h2>
            <p>Tell me what you want to automate on this page.</p>
            <div className="examples">
              <h3>Examples:</h3>
              <ul>
                <li>"Fill out this form with my resume data"</li>
                <li>"Find all product links and save to a file"</li>
                <li>"Upload photos from my Downloads folder"</li>
                <li>"Click through this checkout flow"</li>
              </ul>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message message-${msg.role}`}>
            <div className="message-header">
              <span className="message-role">
                {msg.role === 'user' ? '👤' : msg.role === 'assistant' ? '🤖' : 'ℹ️'}
              </span>
              <span className="message-time">
                {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={
            apiKey
              ? "What would you like me to do on this page?"
              : "Please set your API key first (click ⚙️)"
          }
          disabled={status.running || !apiKey}
          rows={3}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || status.running || !apiKey}
          className="send-btn"
        >
          Send
        </button>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
