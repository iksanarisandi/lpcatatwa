(function() {
  'use strict';

  const SITE_ID = "catatwa.de";
  const API_URL = "https://chatbotwebagent.threadsauto.workers.dev/api/chat";
  const BOT_NAME = "Catat Uang WA Bot";
  const WELCOME_MSG = "Halo! 👋 Ada yang bisa aku bantu soal Catat Uang WA? Tanya aja apa aja ya!";
  const ACCENT = "#16a34a";
  const MAX_HISTORY = 20; // max pesan yang disimpan di memori

  // ── State ──────────────────────────────────────────────────────────────
  let history = [];
  let isOpen = false;
  let isLoading = false;

  // ── Inject CSS ─────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #cs-widget-root * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; }
    #cs-widget-root { position: fixed; bottom: 24px; right: 24px; z-index: 9999; }

    #cs-toggle-btn {
      width: 56px; height: 56px; border-radius: 50%;
      background: ${ACCENT}; color: #fff; border: none;
      cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,.22);
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s, box-shadow .2s;
    }
    #cs-toggle-btn:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,.28); }
    #cs-toggle-btn svg { width: 26px; height: 26px; }

    #cs-window {
      position: absolute; bottom: 68px; right: 0;
      width: 360px; height: 520px;
      background: #fff; border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,.18);
      display: flex; flex-direction: column;
      overflow: hidden; opacity: 0; pointer-events: none;
      transform: translateY(12px) scale(.97);
      transition: opacity .2s, transform .2s;
    }
    #cs-window.open { opacity: 1; pointer-events: all; transform: translateY(0) scale(1); }

    #cs-header {
      background: ${ACCENT}; color: #fff;
      padding: 14px 16px; display: flex; align-items: center; gap: 10px;
      flex-shrink: 0;
    }
    #cs-header .avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: rgba(255,255,255,.25);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
    }
    #cs-header .info { flex: 1; }
    #cs-header .name { font-size: 14px; font-weight: 600; }
    #cs-header .status { font-size: 11px; opacity: .85; display: flex; align-items: center; gap: 4px; }
    #cs-header .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; flex-shrink: 0; }
    #cs-close-btn { background: none; border: none; color: #fff; cursor: pointer; opacity: .8; padding: 4px; border-radius: 4px; }
    #cs-close-btn:hover { opacity: 1; background: rgba(255,255,255,.15); }

    #cs-messages {
      flex: 1; overflow-y: auto; padding: 14px;
      display: flex; flex-direction: column; gap: 10px;
      scroll-behavior: smooth;
    }
    #cs-messages::-webkit-scrollbar { width: 4px; }
    #cs-messages::-webkit-scrollbar-track { background: transparent; }
    #cs-messages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }

    .cs-msg { display: flex; flex-direction: column; max-width: 84%; }
    .cs-msg.user { align-self: flex-end; align-items: flex-end; }
    .cs-msg.bot  { align-self: flex-start; align-items: flex-start; }
    .cs-bubble {
      padding: 9px 13px; border-radius: 14px;
      font-size: 13.5px; line-height: 1.55; word-break: break-word;
    }
    .cs-msg.user .cs-bubble { background: ${ACCENT}; color: #fff; border-bottom-right-radius: 4px; }
    .cs-msg.bot  .cs-bubble { background: #f1f5f9; color: #1e293b; border-bottom-left-radius: 4px; }
    .cs-time { font-size: 10px; color: #94a3b8; margin-top: 3px; padding: 0 4px; }

    .cs-typing { display: flex; gap: 4px; align-items: center; padding: 10px 14px; }
    .cs-typing span {
      width: 7px; height: 7px; border-radius: 50%; background: #94a3b8;
      animation: cs-bounce .9s infinite;
    }
    .cs-typing span:nth-child(2) { animation-delay: .15s; }
    .cs-typing span:nth-child(3) { animation-delay: .30s; }
    @keyframes cs-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

    #cs-input-area {
      padding: 10px 12px 12px; border-top: 1px solid #e2e8f0;
      display: flex; gap: 8px; align-items: flex-end; flex-shrink: 0;
    }
    #cs-input {
      flex: 1; border: 1.5px solid #e2e8f0; border-radius: 10px;
      padding: 8px 12px; font-size: 13.5px; resize: none;
      outline: none; max-height: 96px; min-height: 38px; line-height: 1.5;
      color: #1e293b; background: #fff; transition: border-color .15s;
    }
    #cs-input:focus { border-color: ${ACCENT}; }
    #cs-input::placeholder { color: #94a3b8; }
    #cs-send-btn {
      width: 38px; height: 38px; border-radius: 9px;
      background: ${ACCENT}; color: #fff; border: none;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: opacity .15s;
    }
    #cs-send-btn:disabled { opacity: .45; cursor: default; }
    #cs-send-btn svg { width: 18px; height: 18px; }

    #cs-powered {
      text-align: center; font-size: 10px; color: #cbd5e1;
      padding: 0 0 8px; flex-shrink: 0;
    }

    @media (max-width: 420px) {
      #cs-window { width: calc(100vw - 20px); right: -12px; }
    }
  `;
  document.head.appendChild(style);

  // ── HTML ───────────────────────────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'cs-widget-root';
  root.innerHTML = `
    <div id="cs-window" role="dialog" aria-label="Chat dengan ${BOT_NAME}">
      <div id="cs-header">
        <div class="avatar">🤖</div>
        <div class="info">
          <div class="name">${BOT_NAME}</div>
          <div class="status"><span class="status-dot"></span> Online</div>
        </div>
        <button id="cs-close-btn" aria-label="Tutup chat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div id="cs-messages" role="log" aria-live="polite"></div>
      <div id="cs-input-area">
        <textarea id="cs-input" placeholder="Ketik pesan Anda..." rows="1" maxlength="800" aria-label="Pesan"></textarea>
        <button id="cs-send-btn" aria-label="Kirim">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
      <div id="cs-powered">Powered by AI</div>
    </div>
    <button id="cs-toggle-btn" aria-label="Buka chat">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    </button>
  `;
  document.body.appendChild(root);

  // ── Elements ───────────────────────────────────────────────────────────
  const win      = document.getElementById('cs-window');
  const msgs     = document.getElementById('cs-messages');
  const input    = document.getElementById('cs-input');
  const sendBtn  = document.getElementById('cs-send-btn');
  const toggleBtn = document.getElementById('cs-toggle-btn');
  const closeBtn = document.getElementById('cs-close-btn');

  // ── Helpers ────────────────────────────────────────────────────────────
  function now() {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
              .replace(/"/g,'&quot;').replace(/'/g,'&#039;').replace(/\n/g,'<br>');
  }

  function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = 'cs-msg ' + role;
    div.innerHTML = '<div class="cs-bubble">' + escapeHtml(text) + '</div>'
                  + '<div class="cs-time">' + now() + '</div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function showTyping() {
    const d = document.createElement('div');
    d.className = 'cs-msg bot'; d.id = 'cs-typing';
    d.innerHTML = '<div class="cs-bubble cs-typing"><span></span><span></span><span></span></div>';
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById('cs-typing');
    if (t) t.remove();
  }

  function setLoading(v) {
    isLoading = v;
    sendBtn.disabled = v;
    input.disabled = v;
  }

  // ── Inisialisasi welcome message ───────────────────────────────────────
  addMessage('bot', WELCOME_MSG);

  // ── Send message ───────────────────────────────────────────────────────
  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isLoading) return;

    input.value = '';
    input.style.height = 'auto';
    addMessage('user', text);
    setLoading(true);
    showTyping();

    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: SITE_ID,
          message: text,
          history: history.slice(-20)
        })
      });

      removeTyping();

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Gagal terhubung' }));
        addMessage('bot', err.error || 'Maaf, terjadi kesalahan. Silakan coba lagi.');
        setLoading(false);
        return;
      }

      // ── Streaming SSE ────────────────────────────────────────────────
      const botDiv = document.createElement('div');
      botDiv.className = 'cs-msg bot';
      const bubble = document.createElement('div');
      bubble.className = 'cs-bubble';
      const timeEl = document.createElement('div');
      timeEl.className = 'cs-time';
      timeEl.textContent = now();
      botDiv.appendChild(bubble);
      botDiv.appendChild(timeEl);
      msgs.appendChild(botDiv);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.error) {
                bubble.innerHTML = escapeHtml(data.error);
                break;
              }
              if (data.content) {
                fullText += data.content;
                bubble.innerHTML = escapeHtml(fullText);
                msgs.scrollTop = msgs.scrollHeight;
              }
            } catch(e) {}
          }
        }
      }

      // Simpan ke history
      if (fullText) {
        history.push({ role: 'user', content: text });
        history.push({ role: 'assistant', content: fullText });
        if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);
      }

    } catch (err) {
      removeTyping();
      addMessage('bot', 'Koneksi gagal. Periksa jaringan Anda.');
    }

    setLoading(false);
    input.focus();
  }

  // ── Auto-resize textarea ───────────────────────────────────────────────
  input.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 96) + 'px';
  });

  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  // ── Toggle open/close ──────────────────────────────────────────────────
  function openWidget() {
    isOpen = true;
    win.classList.add('open');
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>`;
    setTimeout(() => input.focus(), 200);
  }

  function closeWidget() {
    isOpen = false;
    win.classList.remove('open');
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>`;
  }

  toggleBtn.addEventListener('click', () => isOpen ? closeWidget() : openWidget());
  closeBtn.addEventListener('click', closeWidget);

  // Tekan Escape untuk tutup
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeWidget();
  });

})();