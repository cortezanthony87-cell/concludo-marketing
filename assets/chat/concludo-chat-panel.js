/*! Concludo website chat panel. Loaded by concludo-chat.js on first open. No dependencies, no cookies. */
(function () {
  'use strict';
  var S = { endpoint: '', cfg: null, launcher: null, root: null, host: null, open: false, busy: false, history: [], visitor: '', started: false, view: 'chat', name: '', awaitName: false };
  var MAX = 800;
  var SAFE_HOSTS = ['concludo.au', 'www.concludo.au', 'app.concludo.com.au'];

  function store(k, v) { try { if (v === undefined) return JSON.parse(sessionStorage.getItem(k) || 'null'); sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function uuid() { try { return crypto.randomUUID(); } catch (e) { return 'v' + Math.random().toString(36).slice(2) + Date.now().toString(36); } }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'on') Object.keys(attrs.on).forEach(function (ev) { n.addEventListener(ev, attrs.on[ev]); });
      else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function event(type) {
    try { fetch(S.endpoint + '/event', { method: 'POST', keepalive: true, credentials: 'omit', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: type, page: location.pathname }) }); } catch (e) { /* ignore */ }
  }
  function safeUrl(u) {
    try {
      if (/^mailto:hello@concludo\.au$/i.test(u)) return u;
      var x = new URL(u);
      var demo = S.cfg.links && S.cfg.links.demo ? new URL(S.cfg.links.demo).host : null;
      if (x.protocol === 'https:' && (SAFE_HOSTS.indexOf(x.host) >= 0 || x.host === demo)) return x.href;
    } catch (e) { /* not a URL */ }
    return null;
  }

  // Safe rendering: text nodes only. Supports **bold**, "- " bullets, numbered lines and allow-listed links.
  function inline(text) {
    var frag = document.createDocumentFragment();
    var re = /(\*\*[^*]+\*\*)|(https:\/\/[^\s)]+[^\s).,;:!?])|(hello@concludo\.au)/g, last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      if (m[1]) frag.appendChild(el('strong', { text: m[1].slice(2, -2) }));
      else if (m[2]) { var u = safeUrl(m[2]); frag.appendChild(u ? el('a', { href: u, target: '_blank', rel: 'noopener', text: m[2].replace(/^https:\/\//, '') }) : document.createTextNode(m[2])); }
      else if (m[3]) frag.appendChild(el('a', { href: 'mailto:hello@concludo.au', text: m[3] }));
      last = re.lastIndex;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    return frag;
  }
  function render(target, text) {
    target.textContent = '';
    var list = null;
    text.split('\n').forEach(function (line) {
      var b = /^\s*(?:-|\d+\.)\s+(.*)$/.exec(line);
      if (b) {
        if (!list) { list = el(/^\s*\d/.test(line) ? 'ol' : 'ul'); target.appendChild(list); }
        var li = el('li'); li.appendChild(inline(b[1])); list.appendChild(li);
      } else {
        list = null;
        if (line.trim()) { var p = el('p'); p.appendChild(inline(line)); target.appendChild(p); }
      }
    });
  }

  var CSS = [
    ':host{all:initial}',
    '[hidden]{display:none!important}',
    '*{box-sizing:border-box}',
    '.panel{position:fixed;right:20px;bottom:92px;z-index:2147483001;width:384px;max-width:calc(100vw - 32px);height:min(620px,calc(100vh - 120px));display:flex;flex-direction:column;background:#fff;color:#16263F;border-radius:16px;box-shadow:0 18px 50px rgba(22,38,63,.28);overflow:hidden;font:15px/1.5 Inter,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;opacity:0;transform:translateY(8px);transition:opacity .16s ease,transform .16s ease}',
    '.panel.on{opacity:1;transform:none}',
    '.panel[hidden]{display:none}',
    '@media (max-width:640px){.panel{right:0;bottom:0;width:100vw;max-width:100vw;height:100dvh;border-radius:0}}',
    '@media (prefers-reduced-motion:reduce){.panel{transition:none}.dots i{animation:none!important}}',
    'header{flex-shrink:0;background:#16263F;color:#fff;padding:14px 14px 12px 16px;display:flex;align-items:flex-start;gap:8px}',
    'header .t{flex:1;min-width:0}',
    'header h2{margin:0;font:700 16px/1.3 Poppins,Inter,system-ui,sans-serif;color:#fff}',
    'header p{margin:2px 0 0;font-size:12.5px;color:#E2B53C}',
    '.hb{background:transparent;border:1px solid rgba(255,255,255,.35);color:#fff;border-radius:8px;padding:6px 10px;font:600 12.5px Inter,system-ui,sans-serif;cursor:pointer;min-height:36px}',
    '.hb:hover{background:#21395C}',
    '.x{width:36px;padding:0;font-size:20px;line-height:1}',
    'button:focus-visible,a:focus-visible,textarea:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #E2B53C;outline-offset:2px}',
    '.log{flex:1;min-height:0;overflow-y:auto;padding:18px 16px 16px;background:#fff;display:flex;flex-direction:column;gap:10px;scroll-padding-top:12px}.log>*{flex-shrink:0}',
    '.m{max-width:88%;padding:10px 12px;border-radius:14px;word-wrap:break-word;overflow-wrap:anywhere}',
    '.m p{margin:0 0 6px}.m p:last-child{margin:0}.m ul,.m ol{margin:4px 0 6px;padding-left:20px}.m li{margin:2px 0}',
    '.bot{align-self:flex-start;background:#F4F6FA;border-top-left-radius:4px}',
    '.me{align-self:flex-end;background:#16263F;color:#fff;border-top-right-radius:4px}',
    '.bot a{color:#21395C;font-weight:600;text-decoration:underline}',
    '.err{align-self:flex-start;background:#FFF4E5;border:1px solid #E2B53C;color:#5A3B00}',
    '.chips{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start;max-width:100%}',
    '.chip{border:1px solid #21395C;background:#fff;color:#21395C;border-radius:999px;padding:6px 12px;font:600 13px Inter,system-ui,sans-serif;cursor:pointer;min-height:34px;text-decoration:none;display:inline-flex;align-items:center}',
    '.chip:hover{background:#F4F6FA}',
    '.chip.gold{background:#E2B53C;border-color:#BC8A1C;color:#16263F}',
    '.dots{align-self:flex-start;background:#F4F6FA;border-radius:14px;padding:12px 14px;display:flex;gap:4px}',
    '.dots i{width:7px;height:7px;border-radius:50%;background:#21395C;opacity:.5;animation:b 1s infinite}',
    '.dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}',
    '@keyframes b{0%,100%{opacity:.3}50%{opacity:1}}',
    '.compose{border-top:1px solid #DCE2EC;padding:10px 12px 8px;background:#fff}',
    '.row{display:flex;gap:8px;align-items:flex-end}',
    'textarea{flex:1;resize:none;border:1px solid #9AA6B8;border-radius:10px;padding:9px 10px;font:15px/1.4 Inter,system-ui,sans-serif;color:#16263F;max-height:120px;min-height:42px}',
    '.send{background:#16263F;color:#fff;border:0;border-radius:10px;padding:0 14px;height:42px;font:600 14px Inter,system-ui,sans-serif;cursor:pointer}',
    '.send:disabled{background:#8C97A8;cursor:not-allowed}',
    '.meta{display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-size:12px;color:#4A5568;gap:8px}',
    '.meta a{color:#21395C}',
    '.person{background:#E2B53C;color:#16263F;border:1px solid #BC8A1C;border-radius:8px;padding:6px 10px;font:700 12.5px Inter,system-ui,sans-serif;cursor:pointer;min-height:34px;display:inline-flex;align-items:center;text-decoration:none}',
    '.meta a.person{color:#16263F}',
    '.sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}',
    'form{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}',
    'form h3{margin:0;font:700 16px Poppins,Inter,system-ui,sans-serif}',
    'form p{margin:0;font-size:13.5px;color:#4A5568}',
    'label{font-weight:600;font-size:13.5px;display:flex;flex-direction:column;gap:4px}',
    'input[type=text],input[type=email],select,form textarea{border:1px solid #9AA6B8;border-radius:8px;padding:9px 10px;font:15px Inter,system-ui,sans-serif;color:#16263F;background:#fff}',
    '.consent{flex-direction:row;align-items:flex-start;gap:8px;font-weight:400}',
    '.consent input{margin-top:3px;width:18px;height:18px}',
    '.actions{display:flex;gap:8px}',
    '.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}',
    '.status{font-size:13.5px;color:#9B1C1C}',
  ].join('');

  function build() {
    var host = document.createElement('div');
    host.id = 'concludo-chat-panel';
    document.body.appendChild(host);
    var root = host.attachShadow({ mode: 'open' });
    var style = el('style'); style.textContent = CSS; root.appendChild(style);
    var c = S.cfg;
    var panel = el('section', { class: 'panel', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'cc-title', 'aria-describedby': 'cc-sub', hidden: true });
    var head = el('header', null, [
      el('div', { class: 't' }, [el('h2', { id: 'cc-title', text: c.name || 'Clio' }), el('p', { id: 'cc-sub', text: c.label || 'Automated assistant, not a person' })]),
      el('button', { type: 'button', class: 'hb', 'aria-label': 'Clear the conversation', text: 'Clear', on: { click: clearChat } }),
      el('button', { type: 'button', class: 'hb x', 'aria-label': 'Close the chat', text: '×', on: { click: function () { toggle(); } } }),
    ]);
    var log = el('div', { class: 'log', role: 'log', 'aria-live': 'polite', 'aria-relevant': 'additions', 'aria-label': 'Conversation' });
    var ta = el('textarea', { id: 'cc-input', rows: '1', maxlength: String(MAX), placeholder: 'Ask about Concludo', 'aria-describedby': 'cc-count' });
    var send = el('button', { type: 'button', class: 'send', text: 'Send', on: { click: function () { submit(); } } });
    var count = el('span', { id: 'cc-count', 'aria-live': 'off', text: '0/' + MAX });
    var compose = el('div', { class: 'compose' }, [
      el('label', { for: 'cc-input', class: 'sr', text: 'Type your question' }),
      el('div', { class: 'row' }, [ta, send]),
      el('div', { class: 'meta' }, [
        c.handoff_form
          ? el('button', { type: 'button', class: 'person', on: { click: function () { showHandoff(); } }, text: 'Talk to a person' })
          : el('a', { class: 'person', href: 'mailto:hello@concludo.au', on: { click: function () { event('email_click'); } }, text: 'Email us' }),
        count,
        el('a', { href: (c.links && c.links.privacy) || 'https://concludo.au/privacy-policy', target: '_blank', rel: 'noopener', text: 'Privacy' }),
      ]),
    ]);
    ta.addEventListener('input', function () { count.textContent = ta.value.length + '/' + MAX; ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; });
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } });
    panel.appendChild(head); panel.appendChild(log); panel.appendChild(compose);
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); toggle(); return; }
      if (e.key !== 'Tab') return;
      var f = [].slice.call(panel.querySelectorAll('button:not([disabled]),a[href],textarea,input:not(.hpi),select')).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1], act = root.activeElement;
      if (e.shiftKey && act === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && act === last) { e.preventDefault(); first.focus(); }
    });
    root.appendChild(panel);
    S.host = host; S.root = root; S.panel = panel; S.log = log; S.ta = ta; S.send = send; S.compose = compose;
  }

  function scroll() { S.log.scrollTop = S.log.scrollHeight; }

  function botBubble(text) { var b = el('div', { class: 'm bot' }); render(b, text); S.log.appendChild(b); scroll(); return b; }
  function meBubble(text) { var b = el('div', { class: 'm me' }); b.appendChild(el('span', { class: 'sr', text: 'You said: ' })); b.appendChild(document.createTextNode(text)); S.log.appendChild(b); scroll(); }
  function errorBubble(text) { var b = el('div', { class: 'm err', role: 'alert' }); render(b, text); S.log.appendChild(b); scroll(); event('error_shown'); }

  function chips(items) {
    var wrap = el('div', { class: 'chips' });
    items.forEach(function (it) {
      if (it.href) wrap.appendChild(el('a', { class: 'chip' + (it.gold ? ' gold' : ''), href: it.href, target: /^mailto:/.test(it.href) ? null : '_blank', rel: 'noopener', text: it.label, on: { click: function () { if (it.ev) event(it.ev); } } }));
      else wrap.appendChild(el('button', { type: 'button', class: 'chip' + (it.gold ? ' gold' : ''), text: it.label, on: { click: it.click } }));
    });
    S.log.appendChild(wrap); scroll(); return wrap;
  }

  function actionChips(done) {
    var L = S.cfg.links || {}, items = [];
    if (!done) return;
    if (done.action === 'handoff') items.push(S.cfg.handoff_form ? { label: 'Talk to a person', gold: true, click: function () { showHandoff(); } } : { label: 'Email the team', gold: true, href: 'mailto:hello@concludo.au', ev: 'email_click' });
    if (done.action === 'trial' && safeUrl(L.trial || '')) items.push({ label: 'Start the 14-day preview', gold: true, href: L.trial, ev: 'cta_trial' });
    if (done.action === 'pricing' && safeUrl(L.pricing || '')) items.push({ label: 'See pricing', href: L.pricing, ev: 'cta_pricing' });
    if (done.action === 'demo' && L.demo && safeUrl(L.demo)) items.push({ label: 'Book a demo', gold: true, href: L.demo, ev: 'cta_demo' });
    if (done.link && safeUrl(done.link) && done.link !== L.trial && done.link !== L.pricing) items.push({ label: 'Open the page', href: done.link });
    (done.suggestions || []).forEach(function (q) { items.push({ label: q, click: function () { ask(q); } }); });
    if (items.length) chips(items);
  }

  function starterChips() {
    var st = (S.cfg.starters || []).map(function (q) {
      return { label: q, click: function () { event('starter_click'); S.awaitName = false; if (/talk to a person/i.test(q) && S.cfg.handoff_form) showHandoff(); else ask(q); } };
    });
    if (st.length) chips(st);
  }

  // First name: asked once, kept only in this browser tab (sessionStorage), never logged.
  var NOT_NAMES = /^(hi|hello|hey|yes|no|nope|yeah|ok|okay|skip|thanks|what|how|why|when|who|where|can|does|do|is|are|price|pricing|cost|trial|concludo|test|help|anonymous|none|nobody|later|there|team|mate|all|guys|everyone|features|feature|demo|workbook|workbooks|plans|plan|privacy|security|support|refund|info|zoom|teams|free|sure|good|fine|me)$/i;
  function parseName(t) {
    if (/[?@\d]/.test(t) || t.length > 40) return '';
    var intro = /^(?:(hi|hello|hey)[,!]?\s+)?(i'm|i am|im|it's|its|my name is|my name's|name's|call me|this is)\s+/i.test(t.trim());
    var x = t.trim().replace(/[.!,]+$/, '').replace(/^(hi|hello|hey)[,!]?\s+/i, '').replace(/^(i'm|i am|im|it's|its|my name is|my name's|name's|call me|this is)\s+/i, '').replace(/\s+here$/i, '');
    var w = x.split(/\s+/);
    if (w.length > 2 || !/^[A-Za-z][A-Za-z'-]{0,29}$/.test(w[0]) || NOT_NAMES.test(w[0])) return '';
    if (w.length === 2 && (!/^[A-Za-z][A-Za-z'-]{0,29}$/.test(w[1]) || !(intro || (/^[A-Z]/.test(w[0]) && /^[A-Z]/.test(w[1]))))) return '';
    return w[0].charAt(0).toUpperCase() + w[0].slice(1).toLowerCase();
  }

  function greet() {
    botBubble(S.cfg.greeting || "Hi, I'm Clio, Concludo's automated assistant. I'm not a person.");
    if (S.name) { botBubble('Good to see you again, ' + S.name + '. What would you like to know about Concludo?'); starterChips(); }
    else {
      botBubble(S.cfg.ask_name || "Before we start, what's your first name? You can skip this.");
      S.awaitName = true;
      chips([{ label: 'Skip', click: function () { if (!S.awaitName) return; S.awaitName = false; botBubble('No problem. What would you like to know about Concludo?'); starterChips(); S.ta.focus(); } }]);
    }
    S.log.scrollTop = 0;
  }

  function restore() {
    S.name = store('cc_name') || '';
    var h = store('cc_history');
    if (h && h.length) {
      S.history = h;
      botBubble(S.cfg.greeting || '');
      if (S.name) botBubble('Welcome back, ' + S.name + '.');
      h.forEach(function (t) { if (t.role === 'user') meBubble(t.text); else botBubble(t.text); });
      S.started = true;
    } else greet();
  }

  function setBusy(b) { S.busy = b; S.send.disabled = b; S.ta.setAttribute('aria-busy', b ? 'true' : 'false'); }

  function submit() {
    var q = S.ta.value.trim();
    if (!q || S.busy) return;
    S.ta.value = ''; S.ta.dispatchEvent(new Event('input'));
    if (S.awaitName) {
      S.awaitName = false;
      var n = parseName(q);
      if (n) {
        S.name = n; store('cc_name', n);
        meBubble(q);
        botBubble('Nice to meet you, ' + n + '. What would you like to know about Concludo?');
        starterChips();
        return;
      }
    }
    ask(q);
  }

  function ask(q) {
    if (S.busy) return;
    if (!S.started) { S.started = true; event('chat_start'); }
    meBubble(q);
    setBusy(true);
    var dots = el('div', { class: 'dots' }, [el('i'), el('i'), el('i'), el('span', { class: 'sr', text: (S.cfg.name || 'Clio') + ' is typing' })]);
    S.log.appendChild(dots); scroll();
    var bubble = null, text = '', done = null, gotError = null;
    var hp = S.root.querySelector('.hpi');
    fetch(S.endpoint + '/chat', {
      method: 'POST', credentials: 'omit', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visitor_id: S.visitor, visitor_name: S.name || undefined, page: location.pathname, message: q, history: S.history.slice(-40), hp: hp ? hp.value : '' }),
    }).then(function (res) {
      if (!res.ok || !res.body) return res.json().catch(function () { return {}; }).then(function (j) { throw new Error(j.message || 'unavailable'); });
      var reader = res.body.getReader(), dec = new TextDecoder(), buf = '';
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) return;
          buf += dec.decode(r.value, { stream: true });
          var i;
          while ((i = buf.indexOf('\n\n')) >= 0) {
            var block = buf.slice(0, i); buf = buf.slice(i + 2);
            var ev = (/^event: (\w+)/m.exec(block) || [])[1], data = (/^data: (.*)$/m.exec(block) || [])[1];
            if (!ev || !data) continue;
            var d = JSON.parse(data);
            if (ev === 'delta') {
              if (!bubble) { dots.remove(); bubble = el('div', { class: 'm bot', 'aria-busy': 'true' }); S.log.appendChild(bubble); }
              text += d.t; render(bubble, text); scroll();
            } else if (ev === 'done') done = d;
            else if (ev === 'error') gotError = d.message;
          }
          return pump();
        });
      }
      return pump();
    }).catch(function (e) {
      gotError = e && e.message && e.message !== 'unavailable' && e.message.length < 300 && !/fetch|network|load/i.test(e.message) ? e.message : "The chat is taking a short break. Please try again in a moment, or email the Concludo team at hello@concludo.au.";
    }).then(function () {
      dots.remove();
      if (bubble) bubble.setAttribute('aria-busy', 'false');
      if (gotError && !text) errorBubble(gotError);
      if (text) {
        S.history.push({ role: 'user', text: q });
        S.history.push({ role: 'assistant', text: text, sig: done && done.sig });
        if (S.history.length > 40) S.history = S.history.slice(-40);
        store('cc_history', S.history);
      }
      actionChips(done);
      setBusy(false);
      S.ta.focus();
    });
  }

  function clearChat() {
    S.history = []; store('cc_history', []); S.name = ''; store('cc_name', ''); S.log.textContent = ''; S.started = false; event('clear');
    showChat(); greet(); S.ta.focus();
  }

  function showChat() {
    var f = S.panel.querySelector('form'); if (f) f.remove();
    S.log.hidden = false; S.compose.hidden = false; S.view = 'chat';
  }

  function showHandoff() {
    event('handoff_open');
    S.view = 'handoff';
    var lastQ = ''; for (var i = S.history.length - 1; i >= 0; i--) if (S.history[i].role === 'user') { lastQ = S.history[i].text; break; }
    S.log.hidden = true; S.compose.hidden = true;
    var status = el('p', { class: 'status', role: 'alert' });
    var name = el('input', { type: 'text', id: 'cc-name', autocomplete: 'name', required: true, maxlength: '80' });
    var email = el('input', { type: 'email', id: 'cc-email', autocomplete: 'email', required: true, maxlength: '120' });
    var q = el('textarea', { id: 'cc-q', rows: '4', required: true, maxlength: '1000' }); q.value = lastQ;
    var urg = el('select', { id: 'cc-urg' }, [el('option', { value: 'normal', text: 'Normal' }), el('option', { value: 'urgent', text: 'Urgent' })]);
    var consent = el('input', { type: 'checkbox', id: 'cc-consent', required: true });
    var hp = el('input', { type: 'text', class: 'hpi', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true' });
    var submitBtn = el('button', { type: 'submit', class: 'send', text: 'Send to the team' });
    var reply = S.cfg.reply_promise ? ' ' + S.cfg.reply_promise + '.' : '.';
    var form = el('form', { novalidate: true, 'aria-labelledby': 'cc-hf' }, [
      el('h3', { id: 'cc-hf', text: 'Talk to a person' }),
      el('p', { text: 'Your question goes to the Concludo team, who will reply by email' + reply + " We only use these details to reply to you. Please don't include passwords, card details or client information." }),
      el('label', { for: 'cc-name' }, ['Your name', name]),
      el('label', { for: 'cc-email' }, ['Email', email]),
      el('label', { for: 'cc-q' }, ['Your question', q]),
      el('label', { for: 'cc-urg' }, ['How urgent is it?', urg]),
      el('label', { class: 'consent', for: 'cc-consent' }, [consent, el('span', null, ['I agree Concludo can use these details to reply to me. ', el('a', { href: (S.cfg.links && S.cfg.links.privacy) || 'https://concludo.au/privacy-policy', target: '_blank', rel: 'noopener', text: 'Privacy policy' })])]),
      el('div', { class: 'hp', 'aria-hidden': 'true' }, [el('label', null, ['Leave this empty', hp])]),
      status,
      el('div', { class: 'actions' }, [submitBtn, el('button', { type: 'button', class: 'chip', text: 'Back to chat', on: { click: function () { showChat(); S.ta.focus(); } } })]),
    ]);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      if (!name.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) || q.value.trim().length < 3) { status.textContent = 'Please add your name, a valid email and a short question.'; return; }
      if (!consent.checked) { status.textContent = 'Please tick the box so we can use your details to reply.'; consent.focus(); return; }
      submitBtn.disabled = true;
      fetch(S.endpoint + '/handoff', { method: 'POST', credentials: 'omit', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: name.value.trim(), email: email.value.trim(), question: q.value.trim(), urgency: urg.value, consent: true, page: location.pathname, hp: hp.value }) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          if (!x.ok) { status.textContent = x.j.message || 'That did not send. Please email hello@concludo.au.'; submitBtn.disabled = false; return; }
          event('handoff_sent');
          showChat(); botBubble(x.j.message); S.ta.focus();
        })
        .catch(function () { status.textContent = 'That did not send. Please email hello@concludo.au.'; submitBtn.disabled = false; });
    });
    S.panel.appendChild(form);
    name.focus();
  }

  function toggle(launcher) {
    if (launcher) S.launcher = launcher;
    S.open = !S.open;
    S.launcher.setAttribute('aria-expanded', String(S.open));
    if (S.open) {
      S.panel.hidden = false;
      requestAnimationFrame(function () { S.panel.classList.add('on'); });
      event('widget_open');
      if (S.view === 'handoff') { var n = S.root.getElementById('cc-name'); if (n) n.focus(); } else S.ta.focus();
    } else {
      S.panel.classList.remove('on'); S.panel.hidden = true; S.launcher.focus();
    }
  }

  window.ConcludoChatPanel = {
    init: function (o) {
      S.endpoint = o.endpoint; S.cfg = o.config; S.launcher = o.launcher;
      S.visitor = store('cc_visitor') || uuid(); store('cc_visitor', S.visitor);
      if (store('cc_release') !== o.config.release) { store('cc_history', []); store('cc_release', o.config.release); }
      build(); restore();
    },
    toggle: toggle,
  };
})();
