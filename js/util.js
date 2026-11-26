// Utilidades gerais: DOM, normalização de nomes, armazenamento local.

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Normaliza um identificador: minúsculas, sem acentos, só letras/dígitos. */
export function norm(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Compara dois nomes de forma tolerante (plural, prefixos, contidos). */
export function nameMatch(a, b) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const strip = (s) => s.replace(/(es|s)$/, '');
  if (strip(x) === strip(y)) return true;
  if (x.length >= 4 && y.length >= 4 && (x.includes(y) || y.includes(x))) return true;
  return false;
}

/** Melhor candidato: primeiro nome exato, depois singular/plural, depois "contém". */
export function bestMatch(cands, aliases, getName = (x) => x.name, used = null) {
  const free = cands.filter((c) => !used || !used.has(c));
  const strip = (s) => norm(s).replace(/(es|s)$/, '');
  return free.find((c) => aliases.some((a) => norm(getName(c)) === norm(a)))
    || free.find((c) => aliases.some((a) => strip(getName(c)) === strip(a)))
    || free.find((c) => aliases.some((a) => nameMatch(getName(c), a)));
}

/** Nome corresponde a algum dos aliases (lista separada por |). */
export function matchesAny(name, aliases) {
  return aliases.some((a) => nameMatch(name, a));
}

const PREFIX = 'bdquest:';
export const store = {
  get(key, def = null) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v === null ? def : JSON.parse(v);
    } catch { return def; }
  },
  set(key, val) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch { /* sem storage */ }
  },
  del(key) {
    try { localStorage.removeItem(PREFIX + key); } catch { /* sem storage */ }
  },
};

let toastTimer;
export function toast(msg, ms = 2600) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

export function download(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

export function spinner(text = 'Carregando…') {
  return h('div', { class: 'loading' }, h('div', { class: 'spinner' }), text);
}

/** Cria um editor de código (CodeMirror se disponível, senão textarea). */
export function codeEditor(parent, { value = '', mode = 'text/x-pgsql', onChange, minLines = 8, placeholder = '' } = {}) {
  const wrap = h('div', { class: 'editor-wrap' });
  parent.append(wrap);
  if (window.CodeMirror && mode) {
    const cm = window.CodeMirror(wrap, {
      value, mode, lineNumbers: true, matchBrackets: true, indentUnit: 2, tabSize: 2,
      indentWithTabs: false, lineWrapping: true, placeholder,
      extraKeys: { Tab: (c) => c.replaceSelection('  ') },
    });
    if (onChange) cm.on('change', () => onChange(cm.getValue()));
    setTimeout(() => cm.refresh(), 30);
    return {
      get: () => cm.getValue(),
      set: (v) => cm.setValue(v),
      insert: (t) => { cm.replaceSelection(t); cm.focus(); },
      onKey: (fn) => cm.on('keydown', (_, e) => fn(e)),
      focus: () => cm.focus(),
      refresh: () => cm.refresh(),
      el: wrap,
    };
  }
  const ta = h('textarea', { spellcheck: 'false', rows: minLines, placeholder });
  ta.value = value;
  wrap.append(ta);
  if (onChange) ta.addEventListener('input', () => onChange(ta.value));
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = ta.selectionStart;
      ta.setRangeText('  ', s, ta.selectionEnd, 'end');
      ta.dispatchEvent(new Event('input'));
    }
  });
  return {
    get: () => ta.value,
    set: (v) => { ta.value = v; ta.dispatchEvent(new Event('input')); },
    insert: (t) => { ta.setRangeText(t, ta.selectionStart, ta.selectionEnd, 'end'); ta.focus(); ta.dispatchEvent(new Event('input')); },
    onKey: (fn) => ta.addEventListener('keydown', fn),
    focus: () => ta.focus(),
    refresh: () => {},
    el: wrap,
  };
}

/** Feedback padronizado: items = [{status:'ok'|'err'|'warn'|'info', text, why}] */
export function feedbackBox(pass, title, items = []) {
  const icons = { ok: '✓', err: '✗', warn: '!', info: 'i' };
  return h('div', { class: 'feedback ' + (pass ? 'pass' : 'fail') },
    h('div', { class: 'feedback-head' }, pass ? '✓' : '✗', title),
    items.length ? h('ul', {}, items.map((it) => h('li', { class: it.status },
      h('span', { class: 'ic' }, icons[it.status] || '•'),
      h('span', {}, h('span', { html: it.text }), it.why ? h('span', { class: 'why', html: it.why }) : null)))) : null);
}
