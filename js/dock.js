// Ferramentas de conforto: player de música, timer de foco e busca rápida (Ctrl+K).
import { h, store, toast, norm } from './util.js';
import { initScare, triggerScare } from './scare.js';

// ---------- ícones (traço simples) ----------
export const ICON = {
  search: '<svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>',
  music: '<svg viewBox="0 0 16 16"><path d="M6 12V3l7-1.5V10"/><circle cx="4.5" cy="12" r="1.8"/><circle cx="11.5" cy="10.5" r="1.8"/></svg>',
  timer: '<svg viewBox="0 0 16 16"><circle cx="8" cy="9" r="5.5"/><path d="M8 9V6M6.5 1.5h3"/></svg>',
  play: '<svg viewBox="0 0 16 16"><path d="M5 3.5v9l7-4.5z" fill="currentColor" stroke="none"/></svg>',
  pause: '<svg viewBox="0 0 16 16"><path d="M5 3.5v9M11 3.5v9" stroke-width="2.2"/></svg>',
  prev: '<svg viewBox="0 0 16 16"><path d="M4 3.5v9" stroke-width="1.6"/><path d="M12.5 3.5v9L6 8z" fill="currentColor" stroke="none"/></svg>',
  next: '<svg viewBox="0 0 16 16"><path d="M12 3.5v9" stroke-width="1.6"/><path d="M3.5 3.5v9L10 8z" fill="currentColor" stroke="none"/></svg>',
  close: '<svg viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
  trash: '<svg viewBox="0 0 16 16"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"/></svg>',
  reset: '<svg viewBox="0 0 16 16"><path d="M3 8a5 5 0 1 0 1.6-3.7"/><path d="M3 2.5v2.5h2.5"/></svg>',
  theme: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.5"/><path d="M8 2.5v11a5.5 5.5 0 0 0 0-11z" fill="currentColor" stroke="none"/></svg>',
};
const icon = (k) => { const s = h('span', { class: 'ic', html: ICON[k] }); return s; };

// ---------- popovers ----------
const pops = [];
function popover(id, anchor, title) {
  const body = h('div', { class: 'pop-body' });
  const el = h('section', { class: 'pop', id, role: 'dialog', 'aria-label': title },
    h('header', { class: 'pop-head' }, h('span', {}, title), h('button', { class: 'iconbtn ghost', 'aria-label': 'Fechar', html: ICON.close, onclick: () => close() })), body);
  document.body.append(el);
  const open = () => { pops.forEach((p) => p !== api && p.close()); el.classList.add('open'); anchor.setAttribute('aria-expanded', 'true'); position(); };
  const close = () => { el.classList.remove('open'); anchor.setAttribute('aria-expanded', 'false'); };
  const position = () => {
    const r = anchor.getBoundingClientRect();
    const w = el.offsetWidth || 360;
    el.style.top = r.bottom + 6 + 'px';
    el.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)) + 'px';
  };
  anchor.addEventListener('click', () => (el.classList.contains('open') ? close() : open()));
  window.addEventListener('resize', () => el.classList.contains('open') && position());
  const api = { el, body, open, close };
  pops.push(api);
  return api;
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') pops.forEach((p) => p.close()); });
document.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.pop') || e.target.closest('[aria-expanded]')) return;
  pops.forEach((p) => p.close());
});

// =====================================================================
// MÚSICA
// =====================================================================
const PRESETS = [
  { name: 'Lofi Girl — lofi rain (YouTube)', url: 'https://www.youtube.com/watch?v=34G5nvk5SJc&list=PLD4WCKZfeUfs' },
  { name: 'Deep Focus (Spotify)', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ' },
  { name: 'Lofi Beats (Spotify)', url: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn' },
];

export function parseMusicURL(raw) {
  const s = String(raw || '').trim();
  let m = /^spotify:(playlist|album|track|artist|episode|show):([A-Za-z0-9]+)/.exec(s);
  if (m) return { kind: 'spotify', type: m[1], id: m[2] };
  try {
    const u = new URL(s);
    if (/(^|\.)spotify\.com$/.test(u.hostname)) {
      m = /\/(playlist|album|track|artist|episode|show)\/([A-Za-z0-9]+)/.exec(u.pathname);
      if (m) return { kind: 'spotify', type: m[1], id: m[2] };
    }
    if (/(^|\.)(youtube\.com|youtu\.be)$/.test(u.hostname)) {
      const list = u.searchParams.get('list');
      const channel = u.searchParams.get('channel');
      if (/\/embed\/live_stream/.test(u.pathname) && channel) return { kind: 'youtube', channel };
      let video = u.searchParams.get('v');
      if (u.hostname === 'youtu.be') video = u.pathname.slice(1);
      const live = /\/(live|embed|shorts)\/([\w-]{6,})/.exec(u.pathname);
      if (!video && live) video = live[2];
      if (list || video) return { kind: 'youtube', list, video };
    }
  } catch { /* não é URL */ }
  return null;
}

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true; s.onload = res; s.onerror = rej;
    document.head.append(s);
  });
}
let ytReady = null;
function loadYT() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (!ytReady) {
    ytReady = new Promise((res) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); res(); };
    });
    loadScript('https://www.youtube.com/iframe_api').catch(() => { ytReady = null; });
  }
  return ytReady;
}
let spReady = null;
function loadSpotify() {
  if (!spReady) {
    spReady = new Promise((res, rej) => {
      window.onSpotifyIframeApiReady = (api) => res(api);
      loadScript('https://open.spotify.com/embed/iframe-api/v1').catch(rej);
      setTimeout(() => rej(new Error('timeout')), 8000);
    });
    spReady.catch(() => { spReady = null; });
  }
  return spReady;
}

function initMusic(btn, mini) {
  const pop = popover('music-pop', btn, 'Música');
  const st = store.get('music', { saved: PRESETS, last: null, volume: 60 });
  let yt = null, sp = null, kind = null, playing = false;

  const slot = h('div', { class: 'player-slot' }, h('div', { class: 'empty-note' }, 'Nada tocando. Cole um link ou escolha uma playlist salva.'));
  const input = h('input', { class: 'input', type: 'url', placeholder: 'Link de playlist, álbum ou vídeo', value: st.last || '' });
  const vol = h('input', { type: 'range', min: 0, max: 100, value: st.volume ?? 60, 'aria-label': 'Volume' });
  const volRow = h('label', { class: 'vol-row', hidden: true }, 'Volume', vol);
  const list = h('ul', { class: 'saved-list' });

  const playBtn = h('button', { class: 'iconbtn', 'aria-label': 'Tocar/pausar', html: ICON.play, onclick: () => toggle() });
  const prevBtn = h('button', { class: 'iconbtn', 'aria-label': 'Anterior', html: ICON.prev, onclick: () => yt && yt.previousVideo() });
  const nextBtn = h('button', { class: 'iconbtn', 'aria-label': 'Próxima', html: ICON.next, onclick: () => yt && yt.nextVideo() });
  const titleEl = h('button', { class: 'mini-title', onclick: () => pop.open() }, '');
  mini.append(prevBtn, playBtn, nextBtn, titleEl);

  function setPlaying(p) {
    playing = p;
    playBtn.innerHTML = p ? ICON.pause : ICON.play;
    btn.classList.toggle('live', p);
  }
  function setTitle(t) { titleEl.textContent = t || ''; titleEl.title = t || ''; }
  function toggle() {
    if (kind === 'youtube' && yt) (yt.getPlayerState?.() === 1 ? yt.pauseVideo() : yt.playVideo());
    else if (kind === 'spotify' && sp) sp.togglePlay();
  }

  function teardown() {
    try { yt && yt.destroy(); } catch { /* ignora */ }
    try { sp && sp.destroy && sp.destroy(); } catch { /* ignora */ }
    yt = null; sp = null; kind = null;
    slot.innerHTML = '';
    setPlaying(false);
  }

  async function play(url, name) {
    const p = parseMusicURL(url);
    if (!p) { toast('Link não reconhecido. Use um link do YouTube, YouTube Music ou Spotify.'); return; }
    teardown();
    st.last = url; store.set('music', st);
    input.value = url;
    mini.hidden = false;
    prevBtn.hidden = nextBtn.hidden = p.kind !== 'youtube';
    volRow.hidden = p.kind !== 'youtube';
    setTitle(name || 'Carregando…');
    const target = h('div');
    slot.append(target);
    if (p.kind === 'youtube') {
      kind = 'youtube';
      try { await loadYT(); } catch { slot.innerHTML = ''; slot.append(h('div', { class: 'errbox' }, 'Não foi possível carregar o player do YouTube.')); return; }
      const vars = { autoplay: 1, rel: 0, playsinline: 1, modestbranding: 1 };
      if (p.list) { vars.listType = 'playlist'; vars.list = p.list; }
      yt = new window.YT.Player(target, {
        width: '100%', height: '190', videoId: p.channel ? 'live_stream' : (p.video || undefined), playerVars: p.channel ? { ...vars, channel: p.channel } : vars,
        events: {
          onReady: (e) => { e.target.setVolume(Number(vol.value)); e.target.playVideo(); },
          onStateChange: (e) => {
            setPlaying(e.data === 1);
            const d = e.target.getVideoData?.();
            if (d && d.title) setTitle(d.title);
          },
          onError: () => toast('O YouTube recusou este conteúdo (privado ou sem permissão de incorporação).'),
        },
      });
    } else {
      kind = 'spotify';
      const uri = `spotify:${p.type}:${p.id}`;
      setTitle(name || 'Spotify');
      try {
        const api = await loadSpotify();
        api.createController(target, { uri, width: '100%', height: 352 }, (ctrl) => {
          sp = ctrl;
          ctrl.addListener('playback_update', (e) => setPlaying(!e.data.isPaused));
          ctrl.addListener('ready', () => ctrl.play && ctrl.play());
        });
      } catch {
        target.replaceWith(h('iframe', { src: `https://open.spotify.com/embed/${p.type}/${p.id}`, width: '100%', height: '352', allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture', loading: 'lazy', style: { border: '0', borderRadius: '8px' } }));
      }
    }
  }

  function renderSaved() {
    list.innerHTML = '';
    st.saved.forEach((s, i) => {
      list.append(h('li', {},
        h('button', { class: 'saved-play', onclick: () => play(s.url, s.name), title: s.url }, h('span', { class: 'saved-kind' }, parseMusicURL(s.url)?.kind === 'spotify' ? 'Spotify' : 'YouTube'), h('span', {}, s.name)),
        h('button', { class: 'iconbtn ghost', 'aria-label': 'Remover', html: ICON.trash, onclick: () => { st.saved.splice(i, 1); store.set('music', st); renderSaved(); } })));
    });
    if (!st.saved.length) list.append(h('li', { class: 'muted small' }, 'Nenhuma playlist salva.'));
  }
  vol.oninput = () => { st.volume = Number(vol.value); store.set('music', st); yt && yt.setVolume && yt.setVolume(st.volume); };

  const go = () => play(input.value);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  pop.body.append(
    h('div', { class: 'field-row' }, input, h('button', { class: 'btn primary', onclick: go }, 'Tocar')),
    h('p', { class: 'hint' }, 'Aceita YouTube, YouTube Music (music.youtube.com) e Spotify. No Spotify, faixas completas exigem estar logado em open.spotify.com neste navegador; sem login tocam prévias de 30 s. Playlists privadas (ex.: "Músicas curtidas") não podem ser incorporadas.'),
    slot, volRow,
    h('div', { class: 'pop-section' }, h('span', {}, 'Playlists salvas'), h('button', { class: 'btn ghost small', onclick: () => {
      const url = input.value.trim();
      if (!parseMusicURL(url)) return toast('Cole um link válido antes de salvar.');
      const name = prompt('Nome para esta playlist:', titleEl.textContent || 'Minha playlist');
      if (!name) return;
      st.saved.unshift({ name, url }); store.set('music', st); renderSaved();
    } }, 'Salvar link atual')),
    list);
  renderSaved();
}

// =====================================================================
// TIMER DE FOCO (pomodoro)
// =====================================================================
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.2);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.22);
    });
  } catch { /* sem áudio */ }
}

function initTimer(btn, label) {
  const pop = popover('timer-pop', btn, 'Timer de foco');
  const cfg = store.get('timer', { foco: 25, pausa: 5, longa: 15, ciclos: 0 });
  if (cfg.lock === undefined) cfg.lock = true;
  if (cfg.full === undefined) cfg.full = true;
  if (cfg.susto === undefined) cfg.susto = true;
  const MODES = { foco: 'Foco', pausa: 'Pausa curta', longa: 'Pausa longa' };
  let mode = 'foco', left = cfg.foco * 60, running = false, endAt = 0, tick = null;
  // saídas durante o foco: quantas vezes e quanto tempo fora
  let away = { n: 0, ms: 0, since: 0 };

  const isLocked = () => !!cfg.lock && mode === 'foco' && running;

  const display = h('div', { class: 'timer-display' });
  const modeBtns = {};
  const modeRow = h('div', { class: 'seg' });
  for (const k of Object.keys(MODES)) { modeBtns[k] = h('button', { onclick: () => (isLocked() ? askEnd() : setMode(k)) }, MODES[k]); modeRow.append(modeBtns[k]); }
  const startBtn = h('button', { class: 'btn primary', onclick: () => (running ? (isLocked() ? askEnd() : pause()) : start()) }, 'Iniciar');
  const resetBtn = h('button', { class: 'btn secondary', onclick: () => { if (isLocked()) return askEnd(); pause(); left = cfg[mode] * 60; draw(); } }, 'Zerar');
  const count = h('div', { class: 'hint' });
  const durInputs = Object.keys(MODES).map((k) => {
    const i = h('input', { class: 'input num', type: 'number', min: 1, max: 120, value: cfg[k] });
    i.onchange = () => { cfg[k] = Math.max(1, Math.min(120, Number(i.value) || cfg[k])); store.set('timer', cfg); if (mode === k && !running) { left = cfg[k] * 60; draw(); } };
    return h('label', { class: 'dur' }, MODES[k], i, 'min');
  });
  const opt = (key, text) => {
    const i = h('input', { type: 'checkbox' });
    i.checked = !!cfg[key];
    i.onchange = () => { cfg[key] = i.checked; store.set('timer', cfg); draw(); };
    return { i, el: h('label', { class: 'check' }, i, h('span', {}, text)) };
  };
  const optLock = opt('lock', 'Travar a página durante o foco (só sai quando o tempo acabar ou você encerrar)');
  const optFull = opt('full', 'Tela cheia com teclado travado (segure Esc para sair)');
  const optScare = opt('susto', 'Sustos aleatórios para manter a atenção (1 em 100.000 por segundo)');
  initScare(() => !!cfg.susto);
  const lockNote = h('div', { class: 'hint lock-note' });

  // ---------- tela de bloqueio ----------
  const gTime = h('div', { class: 'fg-time' });
  const gTitle = h('h2', {});
  const gMsg = h('p', {});
  const gStats = h('p', { class: 'fg-stats' });
  const backBtn = h('button', { class: 'btn primary', onclick: () => { hideGuard(); enterFull(); } }, 'Voltar ao foco');
  const endBtn = h('button', { class: 'btn ghost', onclick: () => {
    if (endBtn.dataset.arm) endFocus();
    else { endBtn.dataset.arm = '1'; endBtn.textContent = 'Tem certeza? Clique de novo para encerrar'; }
  } }, 'Encerrar foco');
  const guard = h('div', { class: 'focus-guard', hidden: true, role: 'alertdialog', 'aria-modal': 'true' },
    h('div', { class: 'fg-box' }, h('div', { class: 'fg-kicker' }, 'Modo foco'), gTime, gTitle, gMsg, gStats,
      h('div', { class: 'btnrow center' }, backBtn, endBtn)));
  document.body.append(guard);
  const GUARD = {
    back: ['Você saiu da página', 'O foco continua valendo. Volte e termine o ciclo.'],
    fullscreen: ['A tela cheia foi fechada', 'O foco continua valendo. Volte para a tela cheia para continuar.'],
    reload: ['Sessão de foco em andamento', 'Recarregar ou reabrir a página não encerra o foco.'],
    end: ['Encerrar o foco antes do tempo?', 'Pausar, zerar ou trocar de modo encerra o ciclo de foco atual.'],
  };
  function showGuard(kind) {
    const [t, m] = GUARD[kind];
    gTitle.textContent = t; gMsg.textContent = m;
    delete endBtn.dataset.arm; endBtn.textContent = 'Encerrar foco';
    guard.hidden = false; pops.forEach((p) => p.close());
    draw();
  }
  function hideGuard() { guard.hidden = true; }
  function askEnd() { showGuard('end'); }

  const saveSess = () => store.set('focusSession', { endAt, n: away.n, ms: away.ms });
  const clearSess = () => store.set('focusSession', null);

  async function enterFull() {
    if (!isLocked() || !cfg.full) return;
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      if (navigator.keyboard && navigator.keyboard.lock) await navigator.keyboard.lock();
    } catch { /* navegador recusou: fica só o aviso de saída */ }
  }
  function exitFull() {
    try { if (navigator.keyboard && navigator.keyboard.unlock) navigator.keyboard.unlock(); } catch { /* */ }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  // fechar a aba, recarregar ou digitar outro endereço → o navegador pede confirmação
  window.addEventListener('beforeunload', (e) => { if (isLocked()) { e.preventDefault(); e.returnValue = ''; } });
  // links externos ficam bloqueados
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || !isLocked()) return;
    if (new URL(a.href, location.href).origin !== location.origin) { e.preventDefault(); e.stopPropagation(); toast('Links externos ficam bloqueados durante o foco.'); }
  }, true);
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isLocked() && cfg.full && guard.hidden) showGuard('fullscreen');
  });
  function markAway() {
    if (!isLocked() || away.since) return;
    away.since = Date.now(); away.n++; saveSess(); beep(); draw();
  }
  function markBack() {
    if (!away.since) return;
    away.ms += Date.now() - away.since; away.since = 0; saveSess();
    showGuard('back');
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? markAway() : markBack()));
  window.addEventListener('pagehide', markAway); // fechou/recarregou: conta uma saída (uma vez só)
  // clicar no player (iframe) também tira o foco da janela: isso não conta como saída
  window.addEventListener('blur', () => setTimeout(() => {
    if (document.activeElement && document.activeElement.tagName === 'IFRAME') return;
    markAway();
  }, 0));
  window.addEventListener('focus', markBack);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const fmtAway = () => `Saídas neste ciclo: ${away.n}` + (away.ms >= 1000 ? ` · tempo fora: ${fmt(Math.round(away.ms / 1000))}` : '');
  function draw() {
    const locked = isLocked();
    display.textContent = fmt(left);
    Object.entries(modeBtns).forEach(([k, b]) => b.classList.toggle('on', k === mode));
    startBtn.textContent = running ? (locked ? 'Encerrar foco' : 'Pausar') : (left < cfg[mode] * 60 ? 'Continuar' : 'Iniciar');
    label.textContent = running || left < cfg[mode] * 60 ? `${mode === 'foco' ? 'Foco' : 'Pausa'} ${fmt(left)}` : 'Timer';
    btn.classList.toggle('live', running);
    btn.classList.toggle('locked', locked);
    count.textContent = `Ciclos de foco concluídos hoje: ${cfg.ciclos}`;
    optLock.i.disabled = optFull.i.disabled = locked;
    lockNote.textContent = locked ? `Foco travado até o fim do tempo. ${fmtAway()}` : '';
    gTime.textContent = fmt(left);
    gStats.textContent = fmtAway();
    if (away.since) document.title = '⚠ Volte ao foco! · BD Quest';
    else if (running) document.title = `${fmt(left)} · BD Quest`;
    else document.title = 'BD Quest · Banco de Dados I';
  }
  function setMode(k) { pause(); mode = k; left = cfg[k] * 60; draw(); }
  function start() {
    running = true; endAt = Date.now() + left * 1000;
    clearInterval(tick);
    tick = setInterval(() => {
      left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      if (left === 0) finish();
      draw();
    }, 250);
    if (isLocked()) { saveSess(); enterFull(); }
    draw();
  }
  function pause() { running = false; clearInterval(tick); draw(); }
  function endFocus() {
    const stats = fmtAway();
    pause(); clearSess(); exitFull(); hideGuard();
    left = cfg.foco * 60; away = { n: 0, ms: 0, since: 0 };
    toast(`Foco encerrado antes do tempo. ${stats}`, 5000);
    draw();
  }
  function finish() {
    const wasLocked = isLocked();
    const stats = fmtAway();
    pause(); beep();
    if (mode === 'foco') {
      if (wasLocked) { clearSess(); exitFull(); hideGuard(); }
      away = { n: 0, ms: 0, since: 0 };
      const today = new Date().toDateString();
      if (cfg.dia !== today) { cfg.dia = today; cfg.ciclos = 0; }
      cfg.ciclos++; store.set('timer', cfg);
      toast(`Fim do ciclo de foco. Hora de uma pausa.${wasLocked ? ' ' + stats : ''}`, 6000);
      mode = cfg.ciclos % 4 === 0 ? 'longa' : 'pausa';
    } else { toast('Pausa encerrada. Bora voltar.', 5000); mode = 'foco'; }
    left = cfg[mode] * 60;
  }
  if (cfg.dia !== new Date().toDateString()) { cfg.ciclos = 0; }
  pop.body.append(modeRow, display, h('div', { class: 'btnrow center' }, startBtn, resetBtn), lockNote, count,
    h('div', { class: 'opts' }, optLock.el, optFull.el, h('div', { class: 'check-row' }, optScare.el, h('button', { class: 'btn ghost small', title: 'Ver o susto agora', onclick: () => triggerScare() }, 'Testar'))),
    h('details', { class: 'pop-details' }, h('summary', {}, 'Durações'), h('div', { class: 'durs' }, durInputs)));

  // retomar um foco em andamento (a página foi recarregada ou fechada e reaberta)
  const sess = store.get('focusSession', null);
  if (sess && cfg.lock) {
    if (sess.endAt > Date.now() + 1000) {
      mode = 'foco'; left = Math.round((sess.endAt - Date.now()) / 1000);
      away = { n: Math.max(1, sess.n || 0), ms: sess.ms || 0, since: 0 };
      start(); showGuard('reload');
    } else clearSess();
  }
  draw();
}

// =====================================================================
// BUSCA RÁPIDA (Ctrl+K)
// =====================================================================
function initPalette(btn, getItems) {
  const input = h('input', { class: 'palette-input', type: 'search', placeholder: 'Buscar nível, capítulo da teoria ou boss…', 'aria-label': 'Buscar' });
  const list = h('ul', { class: 'palette-list', role: 'listbox' });
  const box = h('div', { class: 'palette', role: 'dialog', 'aria-label': 'Busca rápida' }, input, list,
    h('div', { class: 'palette-foot' }, h('span', {}, h('kbd', {}, '↑'), h('kbd', {}, '↓'), ' navegar'), h('span', {}, h('kbd', {}, 'Enter'), ' abrir'), h('span', {}, h('kbd', {}, 'Esc'), ' fechar')));
  const overlay = h('div', { class: 'overlay', hidden: true, onclick: (e) => { if (e.target === overlay) close(); } }, box);
  document.body.append(overlay);
  let sel = 0, results = [];
  function render() {
    const q = norm(input.value);
    const items = getItems();
    results = !q ? items.slice(0, 40) : items.filter((it) => norm(it.title + ' ' + it.id + ' ' + (it.sub || '') + ' ' + it.kind).includes(q)).slice(0, 40);
    sel = Math.min(sel, Math.max(0, results.length - 1));
    list.innerHTML = '';
    results.forEach((it, i) => list.append(h('li', { class: i === sel ? 'on' : '', role: 'option', onclick: () => go(it), onmousemove: () => { if (sel !== i) { sel = i; render(); } } },
      h('span', { class: 'pk' }, it.kind), h('span', { class: 'pid' }, it.id), h('span', { class: 'pt' }, it.title), it.done ? h('span', { class: 'pdone' }, 'concluído') : null)));
    if (!results.length) list.append(h('li', { class: 'muted' }, 'Nada encontrado.'));
  }
  function go(it) { close(); location.hash = it.href; }
  function open() { overlay.hidden = false; input.value = ''; sel = 0; render(); input.focus(); }
  function close() { overlay.hidden = true; }
  input.addEventListener('input', () => { sel = 0; render(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(results.length - 1, sel + 1); render(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); render(); }
    if (e.key === 'Enter' && results[sel]) go(results[sel]);
    if (e.key === 'Escape') close();
  });
  btn.addEventListener('click', open);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); overlay.hidden ? open() : close(); }
  });
}

export function initDock({ getSearchItems }) {
  initMusic(document.getElementById('musicbtn'), document.getElementById('miniplayer'));
  initTimer(document.getElementById('timerbtn'), document.getElementById('timerlabel'));
  initPalette(document.getElementById('searchbtn'), getSearchItems);
}
