// Simulado de sintaxe SQL (DDL, DML, visões, triggers), sem consultas.
// Modo rápido: completar lacuna, alternativas, executa/dá erro. Modo escrita: o comando inteiro, corrigido no PostgreSQL.
import { h, store, codeEditor, feedbackBox } from './util.js';
import { SIM_QUESTIONS, SIM_TOPICS, TF_OPTS } from './content/simulado.js';
import { SIM_WRITE } from './content/simulado-escrita.js';
import { gradeSQL } from './sqlcheck.js';
import { DB_INFO } from './data/seeds.js';

const MODES = {
  rapido: {
    label: 'Rápido', bank: SIM_QUESTIONS,
    desc: 'Complete a palavra que falta, escolha a alternativa (teclas 1–4) ou diga se o comando executa ou dá erro. Enter confirma e avança.',
    counts: [[10, '10 questões'], [20, '20 questões'], [30, '30 questões'], [0, 'Todas']],
    times: [[0, 'Sem limite de tempo'], [20, '20 s por questão'], [40, '40 s por questão'], [60, '60 s por questão']],
    def: { n: 20, secs: 0 },
  },
  escrever: {
    label: 'Escrever o comando inteiro', bank: SIM_WRITE,
    desc: 'Você lê o pedido e escreve o SQL completo (CREATE, ALTER, INSERT, UPDATE, DELETE, VIEW, TRIGGER…). O corretor executa no PostgreSQL e compara o efeito com o gabarito, então vale qualquer forma equivalente.',
    counts: [[5, '5 questões'], [10, '10 questões'], [20, '20 questões'], [0, 'Todas']],
    times: [[0, 'Sem limite de tempo'], [60, '1 min por questão'], [120, '2 min por questão'], [180, '3 min por questão']],
    def: { n: 10, secs: 0 },
  },
};
const ALL_QS = [...SIM_QUESTIONS, ...SIM_WRITE];

const norm = (s) => String(s ?? '').trim().replace(/;$/, '').replace(/\s+/g, ' ').toUpperCase();
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
// id estável de cada questão (sobrevive à inclusão de novas questões)
const qid = (q) => { let x = 0; for (const c of q.t + q.q + (q.code || '') + (q.opts || []).join('|')) x = (x * 31 + c.charCodeAt(0)) | 0; return q.t + ':' + (x >>> 0).toString(36); };
const optsOf = (q) => (q.k === 'tf' ? TF_OPTS : q.opts);
const rightText = (q) => (q.k === 'fill' ? q.a[0] : optsOf(q)[q.a]);
const isRight = (q, ans) => (q.k === 'fill' ? q.a.some((a) => norm(a) === norm(ans)) : ans === q.a);
const KIND_LABEL = { fill: 'Complete a lacuna', tf: 'Executa ou dá erro?', mc: 'Escolha a alternativa', write: 'Escreva o comando completo' };

/** Código com a lacuna: input (respondendo) ou a resposta certa destacada (revisão). */
function codeBlock(q, input) {
  const [pre, post] = q.code.split('___');
  return h('pre', { class: 'sim-code' }, pre, input || h('mark', {}, q.a[0]), post);
}
const solutionBlock = (q, open = false) => h('details', { class: 'sim-sol', open },
  h('summary', {}, 'Gabarito (uma das formas corretas)'), h('pre', { class: 'sim-code' }, q.solution));

export function pageSimulado(app) {
  app.className = 'app page sim-page';
  const root = h('div', { class: 'sim' });
  app.append(root);
  const alive = () => document.body.contains(root);
  let cleanup = () => {};
  const clear = () => { cleanup(); cleanup = () => {}; root.innerHTML = ''; window.scrollTo(0, 0); };

  // ---------------- configuração ----------------
  function loadCfg() {
    const c = store.get('sim:cfg', {});
    const cfg = { mode: MODES[c.mode] ? c.mode : 'rapido', topics: Array.isArray(c.topics) ? c.topics : Object.keys(SIM_TOPICS) };
    for (const m of Object.keys(MODES)) cfg[m] = { ...MODES[m].def, ...(c[m] || (m === 'rapido' && c.n != null ? { n: c.n, secs: c.secs } : {})) };
    return cfg;
  }

  function setup() {
    clear();
    const cfg = loadCfg();
    const mode = MODES[cfg.mode];
    const mc = cfg[cfg.mode];
    const wrong = store.get('sim:wrong', []);
    const hist = store.get('sim:hist', []);
    const byId = new Map(ALL_QS.map((q) => [qid(q), q]));
    const wrongQs = wrong.map((id) => byId.get(id)).filter(Boolean);

    const modeBtns = Object.entries(MODES).map(([k, m]) => h('button', {
      type: 'button', class: 'sim-mode' + (k === cfg.mode ? ' on' : ''), 'aria-pressed': k === cfg.mode ? 'true' : 'false',
      onclick: () => { if (k !== cfg.mode) { cfg.mode = k; store.set('sim:cfg', cfg); setup(); } },
    }, h('b', {}, m.label), h('span', { class: 'small muted' }, `${m.bank.length} questões`)));

    const boxes = Object.entries(SIM_TOPICS).map(([k, label]) => {
      const n = mode.bank.filter((q) => q.t === k).length;
      const i = h('input', { type: 'checkbox', checked: cfg.topics.includes(k), value: k });
      i.onchange = upd;
      return { i, el: h('label', { class: 'check' }, i, h('span', {}, label, h('span', { class: 'muted' }, ` (${n})`))) };
    });
    const nSel = h('select', { class: 'input' }, mode.counts.map(([v, t]) => h('option', { value: v, selected: mc.n === v }, t)));
    const tSel = h('select', { class: 'input' }, mode.times.map(([v, t]) => h('option', { value: v, selected: mc.secs === v }, t)));
    const info = h('span', { class: 'small muted' });
    const start = h('button', { class: 'btn primary', onclick: () => {
      save();
      const pool = mode.bank.filter((q) => cfg.topics.includes(q.t));
      play(shuffle(pool).slice(0, mc.n || pool.length), mc.secs);
    } }, 'Começar simulado');
    function save() {
      cfg.topics = boxes.filter((b) => b.i.checked).map((b) => b.i.value);
      mc.n = +nSel.value; mc.secs = +tSel.value;
      store.set('sim:cfg', cfg);
    }
    function upd() {
      save();
      const pool = mode.bank.filter((q) => cfg.topics.includes(q.t)).length;
      info.textContent = `${Math.min(pool, mc.n || pool)} de ${pool} questões disponíveis`;
      start.disabled = !pool;
    }
    nSel.onchange = upd; tSel.onchange = upd;
    const all = (on) => { boxes.forEach((b) => { b.i.checked = on; }); upd(); };

    root.append(...[
      h('header', { class: 'page-head' }, h('div', {},
        h('div', { class: 'overline' }, 'Treino de sintaxe'),
        h('h1', {}, 'Simulado de sintaxe SQL'),
        h('p', { class: 'page-meta' }, 'DDL, restrições, ALTER, INSERT/UPDATE/DELETE, visões, sequências e triggers. Nada de SELECT de consulta: o foco é escrever o comando certo de cabeça, como na prova.'))),
      h('section', { class: 'panel sim-setup' },
        h('h2', { class: 'panel-title' }, 'Modo'),
        h('div', { class: 'sim-modes' }, modeBtns),
        h('p', { class: 'small muted' }, mode.desc),
        h('h2', { class: 'panel-title' }, 'Assuntos'),
        h('div', { class: 'sim-topics' }, boxes.map((b) => b.el)),
        h('div', { class: 'btnrow' }, h('button', { class: 'btn ghost small', onclick: () => all(true) }, 'Marcar todos'), h('button', { class: 'btn ghost small', onclick: () => all(false) }, 'Desmarcar todos')),
        h('div', { class: 'sim-row' }, nSel, tSel, h('span', { class: 'grow' }), info, start)),
      wrongQs.length ? h('section', { class: 'panel sim-wrong' },
        h('div', {}, h('b', {}, `${wrongQs.length} questão${wrongQs.length === 1 ? '' : 'ões'} para revisar`), h('div', { class: 'small muted' }, 'As que você errou nos simulados anteriores (dos dois modos). Saem da lista quando você acerta.')),
        h('button', { class: 'btn secondary', onclick: () => play(shuffle(wrongQs), +tSel.value) }, 'Treinar meus erros')) : null,
      hist.length ? h('section', { class: 'panel' }, h('h2', { class: 'panel-title' }, 'Últimos simulados'),
        h('table', { class: 'tbl sim-hist' }, h('tr', {}, h('th', {}, 'Quando'), h('th', {}, 'Modo'), h('th', {}, 'Acertos'), h('th', {}, 'Tempo')),
          hist.slice(-8).reverse().map((r) => h('tr', {},
            h('td', {}, new Date(r.ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })),
            h('td', {}, r.mode === 'escrever' ? 'Escrita' : r.mode === 'misto' ? 'Revisão' : 'Rápido'),
            h('td', {}, `${r.ok}/${r.n} (${Math.round(100 * r.ok / r.n)}%)`),
            h('td', {}, fmt(r.secs)))))) : null].filter(Boolean));
    upd();
  }

  // ---------------- respondendo ----------------
  function play(qs, secs) {
    clear();
    const results = [];
    const t0 = Date.now();
    let i = 0, answered = false, qStart = 0, cur = null;

    const counter = h('span', { class: 'sim-count' });
    const okEl = h('span', { class: 'sim-ok' });
    const clock = h('span', { class: 'sim-clock' });
    const barFill = h('i');
    const qbar = h('div', { class: 'sim-qtime' }, h('i'));
    const card = h('section', { class: 'sim-card' });
    const end = () => finish(results, qs, Date.now() - t0, secs);
    root.append(...[
      h('div', { class: 'sim-top' }, counter, h('span', { class: 'bar sim-bar' }, barFill), okEl, clock,
        h('button', { class: 'btn ghost small', onclick: () => { if (confirm('Encerrar o simulado agora? As questões que faltam não contam.')) end(); } }, 'Encerrar')),
      secs ? qbar : null, card].filter(Boolean));

    const tick = setInterval(() => {
      if (!alive()) { cleanup(); return; }
      clock.textContent = fmt((Date.now() - t0) / 1000);
      if (secs && !answered) {
        const left = secs - (Date.now() - qStart) / 1000;
        qbar.firstChild.style.width = Math.max(0, 100 * left / secs) + '%';
        qbar.classList.toggle('low', left < Math.min(10, secs / 4));
        if (left <= 0) { if (cur.k === 'write') giveUp(true); else answer(null, true); }
      }
    }, 200);
    const onKey = (e) => {
      if (!alive()) { cleanup(); return; }
      if (answered || !cur || cur.k === 'fill' || cur.k === 'write' || e.ctrlKey || e.metaKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= optsOf(cur).length) { e.preventDefault(); answer(n - 1); }
    };
    document.addEventListener('keydown', onKey);
    cleanup = () => { clearInterval(tick); document.removeEventListener('keydown', onKey); };

    const okCount = () => { okEl.textContent = `✓ ${results.filter((r) => r.ok).length}`; };
    const nextBtn = () => h('button', { class: 'btn primary', onclick: () => { i++; if (i < qs.length) show(); else end(); } }, i + 1 < qs.length ? 'Próxima' : 'Ver resultado');

    let input = null, optBtns = [], editor = null, writeFb = null, gradeBtn = null, grading = false;
    function show() {
      cur = qs[i]; answered = false; qStart = Date.now();
      counter.textContent = `Questão ${i + 1} de ${qs.length}`;
      barFill.style.width = (100 * i / qs.length) + '%';
      okCount();
      card.innerHTML = ''; input = null; optBtns = []; editor = null;
      const q = cur;
      card.append(h('div', { class: 'sim-meta' }, h('span', { class: 'tag' }, SIM_TOPICS[q.t]), h('span', { class: 'small muted' }, KIND_LABEL[q.k])),
        h('div', { class: 'sim-q', html: q.q }));
      if (q.k === 'write') {
        const dbInfo = q.db === 'empresa'
          ? h('details', { class: 'sim-db' }, h('summary', {}, 'Banco emp (script da disciplina): ver tabelas e colunas'), h('div', { class: 'statement', html: DB_INFO.empresa.desc }))
          : h('p', { class: 'small muted sim-db' }, 'Banco vazio: crie tudo o que for pedido.');
        const pre = q.setup ? h('details', { class: 'sim-db' }, h('summary', {}, 'Já executado antes da sua resposta'), h('pre', { class: 'sim-code' }, q.setup)) : null;
        const box = h('div', { class: 'sim-editor' });
        card.append(...[dbInfo, pre, box].filter(Boolean));
        editor = codeEditor(box, { value: '', minLines: 8, placeholder: '-- escreva aqui o comando completo' });
        editor.onKey((e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); gradeWrite(); } });
        gradeBtn = h('button', { class: 'btn primary', onclick: gradeWrite }, 'Corrigir');
        writeFb = h('div');
        card.append(h('div', { class: 'sim-actions' },
          h('span', { class: 'small muted' }, 'Ctrl+Enter corrige.'), h('span', { class: 'grow' }),
          h('button', { class: 'btn ghost', onclick: () => giveUp(false) }, 'Não sei'), gradeBtn), writeFb);
        setTimeout(() => editor && editor.focus(), 60);
      } else if (q.k === 'fill') {
        const w = Math.max(6, ...q.a.map((a) => a.length)) + 2;
        input = h('input', { class: 'sim-blank', type: 'text', size: w, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Palavra que falta' });
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if (!answered) answer(input.value); } });
        card.append(codeBlock(q, input),
          h('div', { class: 'sim-actions' }, h('span', { class: 'small muted' }, 'Digite só o que falta e tecle Enter. Maiúsculas não importam.'), h('span', { class: 'grow' }),
            h('button', { class: 'btn primary', onclick: () => { if (!answered) answer(input.value); } }, 'Responder')));
        setTimeout(() => input.focus(), 30);
      } else {
        if (q.code) card.append(h('pre', { class: 'sim-code' }, q.code));
        card.append(h('div', { class: 'sim-opts' + (q.k === 'tf' ? ' tf' : '') }, optsOf(q).map((o, oi) => {
          const b = h('button', { type: 'button', class: 'sim-opt', onclick: () => { if (!answered) answer(oi); } },
            h('span', { class: 'sim-key' }, oi + 1), q.code_opts ? h('code', {}, o) : h('span', { html: o }));
          optBtns.push(b);
          return b;
        })));
      }
    }

    // modo rápido
    function answer(ans, timeout = false) {
      answered = true;
      const q = cur;
      const ok = !timeout && isRight(q, ans);
      results.push({ q, ans, ok, timeout });
      okCount();
      card.querySelectorAll('.sim-actions').forEach((x) => x.remove());
      if (input) { input.disabled = true; input.classList.add(ok ? 'ok' : 'err'); }
      optBtns.forEach((b, oi) => { b.disabled = true; if (oi === q.a) b.classList.add('right'); else if (oi === ans) b.classList.add('wrong'); });
      const next = nextBtn();
      card.append(h('div', { class: 'sim-fb ' + (ok ? 'ok' : 'err') },
        h('div', { class: 'sim-fb-title' }, ok ? 'Correto' : timeout ? 'Tempo esgotado' : 'Errado'),
        !ok && q.k === 'fill' ? h('div', {}, 'Resposta: ', h('code', {}, q.a.join(' ou ')), ans != null && String(ans).trim() ? h('span', { class: 'muted' }, ` (você escreveu: ${ans})`) : null) : null,
        !ok && q.k !== 'fill' ? h('div', {}, 'Resposta: ', h('b', {}, `${q.a + 1}) `), q.code_opts ? h('code', {}, rightText(q)) : h('span', { html: rightText(q) })) : null,
        h('div', { class: 'sim-exp', html: q.exp || '' }),
        h('div', { class: 'sim-actions' }, h('span', { class: 'small muted' }, 'Enter para continuar'), h('span', { class: 'grow' }), next)));
      setTimeout(() => next.focus(), 30);
    }

    // modo escrita
    function writeFeedback(q, title, okClass, body, openSol) {
      writeFb.innerHTML = '';
      const next = nextBtn();
      writeFb.append(h('div', { class: 'sim-fb ' + okClass }, h('div', { class: 'sim-fb-title' }, title), ...body.filter(Boolean), solutionBlock(q, openSol),
        h('div', { class: 'sim-actions' }, h('span', { class: 'small muted' }, 'Você pode editar e corrigir de novo; a pontuação conta a primeira correção.'), h('span', { class: 'grow' }), next)));
      return next;
    }
    async function gradeWrite() {
      if (grading || !editor) return;
      const q = cur, sql = editor.get();
      if (!sql.trim()) { writeFb.innerHTML = ''; writeFb.append(h('p', { class: 'small err-text' }, 'Escreva o comando antes de corrigir.')); return; }
      grading = true; gradeBtn.disabled = true; gradeBtn.textContent = 'Corrigindo…';
      let r;
      try { r = await gradeSQL({ ...q, mode: 'script' }, sql); } catch (e) { r = { pass: false, items: [{ status: 'err', text: 'Erro ao corrigir: ' + e.message }] }; }
      grading = false;
      if (!alive() || cur !== q) return;
      gradeBtn.disabled = false; gradeBtn.textContent = 'Corrigir de novo';
      const first = !answered;
      if (first) { answered = true; results.push({ q, ans: sql, ok: r.pass }); okCount(); }
      const title = r.pass ? (first ? 'Correto' : 'Agora está correto') : 'Ainda não está certo';
      const next = writeFeedback(q, title, r.pass ? 'ok' : 'err', [
        feedbackBox(r.pass, r.pass ? 'Todos os testes passaram.' : 'Resultado dos testes:', r.items),
      ], false);
      if (r.pass) setTimeout(() => next.focus(), 30);
    }
    function giveUp(timeout) {
      if (!cur || cur.k !== 'write') return;
      const q = cur;
      if (!answered) { answered = true; results.push({ q, ans: editor ? editor.get() : '', ok: false, timeout }); okCount(); }
      writeFeedback(q, timeout ? 'Tempo esgotado' : 'Veja o gabarito', 'err', [], true);
    }
    show();
  }

  // ---------------- resultado ----------------
  function finish(results, qs, ms, secs) {
    clear();
    const n = results.length, ok = results.filter((r) => r.ok).length, s = ms / 1000;
    if (n) {
      const kinds = new Set(results.map((r) => (r.q.k === 'write' ? 'escrever' : 'rapido')));
      const hist = store.get('sim:hist', []);
      hist.push({ ts: Date.now(), n, ok, secs: Math.round(s), mode: kinds.size > 1 ? 'misto' : [...kinds][0] });
      store.set('sim:hist', hist.slice(-30));
      const wrong = new Set(store.get('sim:wrong', []));
      for (const r of results) { if (r.ok) wrong.delete(qid(r.q)); else wrong.add(qid(r.q)); }
      store.set('sim:wrong', [...wrong]);
    }
    const pct = n ? Math.round(100 * ok / n) : 0;
    const errs = results.filter((r) => !r.ok);
    const byTopic = Object.entries(SIM_TOPICS).map(([k, label]) => {
      const rs = results.filter((r) => r.q.t === k);
      return rs.length ? h('tr', {}, h('td', {}, label), h('td', {}, `${rs.filter((r) => r.ok).length}/${rs.length}`),
        h('td', {}, h('span', { class: 'bar' }, h('i', { style: { width: (100 * rs.filter((r) => r.ok).length / rs.length) + '%' } })))) : null;
    });
    const blank = (a) => a == null || String(a).trim() === '';
    const review = (r) => {
      const q = r.q;
      if (q.k === 'write') {
        return h('div', { class: 'sim-rev' },
          h('div', { class: 'sim-meta' }, h('span', { class: 'tag' }, SIM_TOPICS[q.t])),
          h('div', { class: 'sim-q', html: q.q }),
          h('div', { class: 'rep-label' }, 'Gabarito'), h('pre', { class: 'sim-code' }, q.solution),
          blank(r.ans) ? h('div', { class: 'small muted' }, r.timeout ? 'Tempo esgotado.' : 'Sem resposta.') : [h('div', { class: 'rep-label' }, 'Sua resposta'), h('pre', { class: 'sim-code sim-mine' }, r.ans)]);
      }
      return h('div', { class: 'sim-rev' },
        h('div', { class: 'sim-meta' }, h('span', { class: 'tag' }, SIM_TOPICS[q.t])),
        h('div', { class: 'sim-q', html: q.q }),
        q.k === 'fill' ? codeBlock(q) : q.code ? h('pre', { class: 'sim-code' }, q.code) : null,
        q.k !== 'fill' ? h('div', {}, 'Resposta: ', q.code_opts ? h('code', {}, rightText(q)) : h('b', { html: rightText(q) })) : null,
        h('div', { class: 'small muted' }, r.timeout ? 'Tempo esgotado.' : blank(r.ans) ? 'Sem resposta.' : 'Você respondeu: ',
          r.timeout || blank(r.ans) ? null : (q.k === 'fill' ? h('code', {}, r.ans) : q.code_opts ? h('code', {}, optsOf(q)[r.ans]) : h('span', { html: optsOf(q)[r.ans] }))),
        h('div', { class: 'sim-exp', html: q.exp || '' }));
    };
    root.append(...[
      h('header', { class: 'page-head' }, h('div', {}, h('div', { class: 'overline' }, 'Simulado de sintaxe SQL'), h('h1', {}, 'Resultado'))),
      h('section', { class: 'panel sim-score' },
        h('div', { class: 'sim-big ' + (pct >= 70 ? 'ok' : pct >= 50 ? 'warn' : 'err') }, `${pct}%`),
        h('div', {}, h('div', { class: 'sim-score-line' }, `${ok} de ${n} corretas`),
          h('div', { class: 'small muted' }, `Tempo total ${fmt(s)} · média de ${n ? Math.round(s / n) : 0} s por questão${n < qs.length ? ` · encerrado na ${n}ª de ${qs.length}` : ''}`)),
        h('span', { class: 'grow' }),
        h('div', { class: 'btnrow' },
          errs.length ? h('button', { class: 'btn primary', onclick: () => play(shuffle(errs.map((r) => r.q)), secs) }, `Refazer os ${errs.length} erros`) : null,
          h('button', { class: errs.length ? 'btn secondary' : 'btn primary', onclick: setup }, 'Novo simulado'))),
      h('section', { class: 'panel' }, h('h2', { class: 'panel-title' }, 'Por assunto'), h('table', { class: 'tbl sim-topic-tbl' }, byTopic)),
      errs.length ? h('section', { class: 'panel' }, h('h2', { class: 'panel-title' }, 'Para revisar'), errs.map(review))
        : h('p', { class: 'note' }, 'Gabaritou! Tente com limite de tempo ou com mais questões.')].filter(Boolean));
  }

  setup();
}
