// Floating overlay UI - shows agent status on the page

let overlay: HTMLElement | null = null;

export function createOverlay() {
  if (overlay) return;

  overlay = document.createElement('div');
  overlay.id = 'claude-agent-overlay';
  overlay.innerHTML = `
    <div class="overlay-header">
      <span>🤖 Claude Agent</span>
      <button class="overlay-close" id="overlay-close">×</button>
    </div>
    <div class="overlay-status" id="overlay-status">Idle</div>
    <div class="overlay-progress" id="overlay-progress"></div>
    <div class="overlay-messages" id="overlay-messages"></div>
  `;

  // Styles
  const style = document.createElement('style');
  style.textContent = `
    #claude-agent-overlay {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      max-height: 400px;
      background: white;
      border: 2px solid #6366f1;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      z-index: 999999;
      font-family: system-ui, -apple-system, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .overlay-header {
      background: #6366f1;
      color: white;
      padding: 12px 16px;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .overlay-close {
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      line-height: 1;
    }

    .overlay-status {
      padding: 12px 16px;
      font-weight: 600;
      color: #6366f1;
      border-bottom: 1px solid #e5e7eb;
    }

    .overlay-progress {
      padding: 8px 16px;
      font-size: 13px;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
    }

    .overlay-messages {
      flex: 1;
      overflow-y: auto;
      padding: 12px 16px;
      font-size: 13px;
      max-height: 250px;
    }

    .overlay-message {
      margin-bottom: 8px;
      padding: 8px;
      background: #f3f4f6;
      border-radius: 6px;
      font-size: 12px;
    }

    .overlay-message.agent {
      background: #dbeafe;
      color: #1e40af;
    }

    .overlay-message.error {
      background: #fee2e2;
      color: #991b1b;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(overlay);

  // Close button handler
  document.getElementById('overlay-close')?.addEventListener('click', () => {
    hideOverlay();
  });
}

export function showOverlay() {
  if (!overlay) createOverlay();
  if (overlay) overlay.style.display = 'flex';
}

export function hideOverlay() {
  if (overlay) overlay.style.display = 'none';
}

export function updateOverlayStatus(status: string, progress: string) {
  if (!overlay) createOverlay();

  const statusEl = document.getElementById('overlay-status');
  const progressEl = document.getElementById('overlay-progress');

  if (statusEl) statusEl.textContent = status || 'Idle';
  if (progressEl) progressEl.textContent = progress || '';
}

export function addOverlayMessage(message: string, type: 'agent' | 'user' | 'error' = 'agent') {
  if (!overlay) createOverlay();

  const messagesEl = document.getElementById('overlay-messages');
  if (messagesEl) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `overlay-message ${type}`;
    messageDiv.textContent = message;
    messagesEl.appendChild(messageDiv);

    // Auto-scroll to bottom
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Keep max 20 messages
    while (messagesEl.children.length > 20) {
      messagesEl.removeChild(messagesEl.firstChild!);
    }
  }
}

export function clearOverlayMessages() {
  const messagesEl = document.getElementById('overlay-messages');
  if (messagesEl) messagesEl.innerHTML = '';
}
