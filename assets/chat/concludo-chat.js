/*! Concludo website chat loader. Tiny on purpose: the chat panel loads only when a visitor opens it.
 * <script src="/assets/chat/concludo-chat.js" data-endpoint="https://PROJECT.supabase.co/functions/v1/rep-chat" defer></script>
 */
(function () {
  var me = document.currentScript;
  if (!me || window.__concludoChat) return;
  window.__concludoChat = true;
  var endpoint = (me.getAttribute('data-endpoint') || '').replace(/\/$/, '');
  var panelSrc = me.getAttribute('data-panel') || me.src.replace(/concludo-chat(\.min)?\.js(\?.*)?$/, 'concludo-chat-panel.js');
  if (!endpoint) return;

  function start() {
    fetch(endpoint + '/config', { credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (cfg) {
      if (!cfg || !cfg.enabled) return; // switched off: show nothing
      var host = document.createElement('div');
      host.id = 'concludo-chat';
      document.body.appendChild(host);
      var root = host.attachShadow({ mode: 'open' });
      root.innerHTML = '<style>' +
        ':host{all:initial}' +
        'button{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:60px;height:60px;border-radius:50%;border:0;cursor:pointer;' +
        'background:#16263F;color:#E2B53C;box-shadow:0 6px 20px rgba(22,38,63,.35);display:flex;align-items:center;justify-content:center}' +
        'button:hover{background:#21395C}button:focus-visible{outline:3px solid #E2B53C;outline-offset:3px}' +
        'svg{width:28px;height:28px}' +
        '@media print{button{display:none}}' +
        '</style>' +
        '<button type="button" aria-label="Open the chat with Clio, Concludo&#39;s automated assistant" aria-haspopup="dialog" aria-expanded="false">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/></svg></button>';
      var btn = root.querySelector('button');
      var loading = null;
      function open() {
        if (window.ConcludoChatPanel) return window.ConcludoChatPanel.toggle(btn);
        if (loading) return;
        loading = document.createElement('script');
        loading.src = panelSrc;
        loading.async = true;
        loading.onload = function () { window.ConcludoChatPanel.init({ endpoint: endpoint, config: cfg, launcher: btn }); window.ConcludoChatPanel.toggle(btn); };
        loading.onerror = function () { loading = null; window.location.href = 'mailto:hello@concludo.au'; };
        document.head.appendChild(loading);
      }
      btn.addEventListener('click', open);
      // Warm the panel script once the page is idle, so the first open is instant. It does not run until opened.
      var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 2500); };
      idle(function () { var l = document.createElement('link'); l.rel = 'prefetch'; l.href = panelSrc; document.head.appendChild(l); });
    }).catch(function () { /* chat unavailable: show nothing */ });
  }

  if (document.readyState === 'complete') setTimeout(start, 0);
  else window.addEventListener('load', function () { setTimeout(start, 0); });
})();
