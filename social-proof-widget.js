/**
 * Catat Uang WA - Social Proof Widget
 *
 * Embed di landing page HTML manapun dengan:
 * <script src="social-proof-widget.js" data-api="https://catat-uang-backend.threadsauto.workers.dev/api/social-proof/recent"></script>
 *
 * Konfigurasi via data attributes:
 *   data-api        - URL endpoint social proof (wajib)
 *   data-position   - posisi: "bottom-left" (default) atau "bottom-right"
 *   data-interval   - interval ganti notif dalam ms (default 8000)
 *   data-duration   - durasi tampil per notif dalam ms (default 5000)
 *   data-max        - max notif yang ditampilkan (default 10)
 *   data-dark       - "true" untuk dark mode
 */
(function () {
  // Baca konfigurasi dari <script> tag
  const currentScript =
    document.currentScript ||
    (function () {
      const scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  const config = {
    api: currentScript.getAttribute('data-api') || '',
    position: currentScript.getAttribute('data-position') || 'bottom-left',
    interval: parseInt(currentScript.getAttribute('data-interval') || '8000', 10),
    duration: parseInt(currentScript.getAttribute('data-duration') || '5000', 10),
    max: parseInt(currentScript.getAttribute('data-max') || '10', 10),
    dark: currentScript.getAttribute('data-dark') === 'true',
  };

  if (!config.api) {
    console.warn('[SocialProof] data-api attribute is required');
    return;
  }

  // --- Styling ---
  const isLeft = config.position === 'bottom-left';
  const bgColor = config.dark ? '#1f2937' : '#ffffff';
  const textColor = config.dark ? '#f3f4f6' : '#1f2937';
  const subtextColor = config.dark ? '#9ca3af' : '#6b7280';
  const borderColor = config.dark ? '#374151' : '#e5e7eb';
  const shadow = config.dark
    ? '0 4px 24px rgba(0,0,0,0.4)'
    : '0 4px 24px rgba(0,0,0,0.12)';

  const style = document.createElement('style');
  style.textContent = `
    @keyframes sp-slide-in {
      from { transform: translateX(${isLeft ? '-120%' : '120%'}); opacity: 0; }
      to   { transform: translateX(0); opacity: 1; }
    }
    @keyframes sp-slide-out {
      from { transform: translateX(0); opacity: 1; }
      to   { transform: translateX(${isLeft ? '-120%' : '120%'}); opacity: 0; }
    }
    @keyframes sp-fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .sp-toast {
      position: fixed;
      bottom: 24px;
      ${isLeft ? 'left' : 'right'}: 24px;
      z-index: 9999;
      max-width: 340px;
      min-width: 260px;
      background: ${bgColor};
      border: 1px solid ${borderColor};
      border-radius: 12px;
      box-shadow: ${shadow};
      padding: 14px 18px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: sp-slide-in 0.4s cubic-bezier(0.21, 1.02, 0.73, 1) forwards;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: default;
      transition: box-shadow 0.2s;
    }
    .sp-toast:hover {
      box-shadow: ${shadow}, 0 0 0 2px #10b981;
    }
    .sp-toast.sp-exit {
      animation: sp-slide-out 0.3s ease-in forwards;
    }
    .sp-icon {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .sp-icon svg {
      width: 18px;
      height: 18px;
      fill: none;
      stroke: white;
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .sp-body {
      flex: 1;
      min-width: 0;
    }
    .sp-name {
      font-size: 14px;
      font-weight: 600;
      color: ${textColor};
      line-height: 1.3;
    }
    .sp-detail {
      font-size: 13px;
      color: ${subtextColor};
      margin-top: 2px;
      line-height: 1.4;
    }
    .sp-detail strong {
      color: #10b981;
      font-weight: 600;
    }
    .sp-time {
      font-size: 11px;
      color: ${subtextColor};
      margin-top: 4px;
      opacity: 0.8;
    }
    .sp-close {
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 2px;
      color: ${subtextColor};
      font-size: 16px;
      line-height: 1;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .sp-toast:hover .sp-close {
      opacity: 0.6;
    }
    .sp-close:hover {
      opacity: 1 !important;
    }
    @media (max-width: 480px) {
      .sp-toast {
        left: 12px !important;
        right: 12px !important;
        max-width: none;
        min-width: auto;
      }
    }
  `;
  document.head.appendChild(style);

  // --- Icon SVG ---
  const CHECK_SVG =
    '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';

  // --- State ---
  let entries: any[] = [];
  let currentIndex = 0;
  let activeToast: HTMLElement | null = null;
  let timeoutHide: number | null = null;
  let timeoutNext: number | null = null;

  // --- Fallback data jika API gagal ---
  const fallbackEntries = [
    { name: 'Rani (contoh)', tier: 'Lite', duration: '1 bulan', timeAgo: '2 jam yang lalu' },
    { name: 'Budi (contoh)', tier: 'Premium', duration: '3 bulan', timeAgo: '5 jam yang lalu' },
    { name: 'Sari (contoh)', tier: 'Starter', duration: '1 bulan', timeAgo: '8 jam yang lalu' },
    { name: 'Andi (contoh)', tier: 'Pro', duration: '1 tahun', timeAgo: '12 jam yang lalu' },
    { name: 'Dewi (contoh)', tier: 'Lite', duration: '1 bulan', timeAgo: '1 hari yang lalu' },
    { name: 'Fajar (contoh)', tier: 'Starter', duration: '3 bulan', timeAgo: '1 hari yang lalu' },
    { name: 'Lina (contoh)', tier: 'Premium', duration: '1 bulan', timeAgo: '2 hari yang lalu' },
    { name: 'Riko (contoh)', tier: 'Lite', duration: '1 bulan', timeAgo: '2 hari yang lalu' },
    { name: 'Mira (contoh)', tier: 'Pro', duration: '1 tahun', timeAgo: '3 hari yang lalu' },
    { name: 'Yanto (contoh)', tier: 'Starter', duration: '1 bulan', timeAgo: '4 hari yang lalu' },
  ];

  // --- Fetch data ---
  async function fetchData(): Promise<any[]> {
    try {
      const res = await fetch(config.api);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data?.entries?.length > 0) {
        return json.data.entries.slice(0, config.max);
      }
    } catch (e) {
      console.warn('[SocialProof] Fetch failed, using fallback data:', e);
    }
    return fallbackEntries;
  }

  // --- Show toast ---
  function showToast(entry: any) {
    removeToast();

    const toast = document.createElement('div');
    toast.className = 'sp-toast';
    toast.innerHTML = `
      <div class="sp-icon">${CHECK_SVG}</div>
      <div class="sp-body">
        <div class="sp-name">${escapeHtml(entry.name)}</div>
        <div class="sp-detail">berlangganan paket <strong>${escapeHtml(entry.tier)}</strong> ${escapeHtml(entry.duration)}</div>
        <div class="sp-time">${escapeHtml(entry.timeAgo)}</div>
      </div>
      <button class="sp-close" title="Tutup">&times;</button>
    `;

    // Close button
    toast.querySelector('.sp-close')!.addEventListener('click', () => {
      removeToast();
      scheduleNext(2000); // show next after 2s
    });

    document.body.appendChild(toast);
    activeToast = toast;

    // Auto-hide after duration
    timeoutHide = window.setTimeout(() => {
      hideToast();
    }, config.duration);
  }

  function hideToast() {
    if (activeToast) {
      activeToast.classList.add('sp-exit');
      const el = activeToast;
      setTimeout(() => el.remove(), 300);
      activeToast = null;
    }
  }

  function removeToast() {
    if (timeoutHide) clearTimeout(timeoutHide);
    if (activeToast) {
      activeToast.remove();
      activeToast = null;
    }
  }

  function scheduleNext(delayMs?: number) {
    if (timeoutNext) clearTimeout(timeoutNext);
    timeoutNext = window.setTimeout(() => {
      showNext();
    }, delayMs || config.interval);
  }

  function showNext() {
    if (!entries.length) return;
    currentIndex = currentIndex % entries.length;
    showToast(entries[currentIndex]);
    currentIndex++;
    scheduleNext();
  }

  function escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Init ---
  async function init() {
    // Random initial delay (1-4s) so it doesn't pop immediately
    const initialDelay = 1500 + Math.random() * 2500;

    entries = await fetchData();

    // Shuffle for variety
    for (let i = entries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [entries[i], entries[j]] = [entries[j], entries[i]];
    }

    setTimeout(() => {
      showNext();
    }, initialDelay);

    // Refresh data every 10 minutes
    setInterval(async () => {
      entries = await fetchData();
    }, 10 * 60 * 1000);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
