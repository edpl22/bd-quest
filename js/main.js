// Roteamento e páginas do BD Quest.
import { h, esc, store, toast, codeEditor, spinner } from './util.js';
import { quizWorkspace, erWorkspace, mapWorkspace, raWorkspace, sqlWorkspace, schemaBrowser, resultTable } from './workspaces.js';
import { createEditor, specToModel, staticSVG, emptyModel } from './er.js';
import { WORLDS } from './content/levels.js';
import { BOSSES } from './content/bosses.js';
import { CHAPTERS, FIGS } from './content/theory.js';
import { DB_INFO } from './data/seeds.js';
import { runForDisplay } from './sqlcheck.js';
import { getDB } from './db.js';
import { initDock } from './dock.js';
import { pageExport } from './export.js';
import { pageSimulado } from './simulado.js';

const app = document.getElementById('app');
const EXAM = new Date('2026-11-27T08:00:00-03:00');

// ---------- progresso ----------
const prog = () => store.get('progress', {});
function markDone(id, stars = 3) {
  const p = prog();
  const before = p[id]?.stars || 0;
  p[id] = { stars: Math.max(before, stars), ts: Date.now() };
  store.set('progress', p);
  updateXP();
  if (!before) toast('Concluído: ' + id);
}
const isDone = (id) => !!prog()[id];
const allLevels = () => WORLDS.flatMap((w, wi) => w.levels.map((l) => ({ ...l, world: w, wi })));
const bossUnits = () => BOSSES.flatMap((b) => b.phases.flatMap((p, i) => p.kind === 'sqlset' ? p.tasks.map((t, j) => `${b.id}.p${i}.t${j}`) : [`${b.id}.p${i}`]));
function updateXP() {
  const ids = [...allLevels().map((l) => l.id), ...bossUnits()];
  const done = ids.filter(isDone).length;
  const pct = Math.round(100 * done / ids.length);
  document.getElementById('xpfill').style.width = pct + '%';
  document.getElementById('xptext').textContent = `${done}/${ids.length}`;
  document.getElementById('progress').title = `Progresso geral: ${pct}% (${done} de ${ids.length} itens)`;
}

// ---------- tema ----------
document.getElementById('themebtn').onclick = () => {
  const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const t = cur === 'dark' ? 'light' : 'dark';
  store.set('theme', t);
  document.documentElement.dataset.theme = t;
};

// ---------- helpers ----------
const TYPE_LABEL = { quiz: 'Múltipla escolha', er: 'Modelo ER', map: 'Mapeamento', ra: 'Álgebra', sql: 'SQL' };
const DIFF = ['', 'Fácil', 'Média', 'Difícil'];
const diff = (n) => h('span', { class: 'diff d' + (n || 1) }, DIFF[n || 1]);
const statusDot = (done) => h('span', { class: 'status-dot' + (done ? ' done' : ''), title: done ? 'Concluído' : 'Pendente', 'aria-label': done ? 'Concluído' : 'Pendente' });
const worldNum = (w) => WORLDS.indexOf(w) + 1;
function bar(done, total) {
  return h('span', { class: 'bar' }, h('i', { style: { width: (total ? 100 * done / total : 0) + '%' } }));
}
function stepsList(steps) {
  if (!steps || !steps.length) return h('p', { class: 'muted' }, 'Este desafio não tem roteiro detalhado.');
  return h('ol', { class: 'steps' }, steps.map((s, i) => h('li', {},
    h('details', { open: i === 0 }, h('summary', {}, h('span', { class: 'step-n' }, i + 1), h('span', {}, s.t)), h('div', { class: 'step-body', html: s.html })))));
}
function paneTabs(defs) {
  const head = h('div', { class: 'pane-tabs', role: 'tablist' });
  const body = h('div', { class: 'pane-body' });
  const btns = {}, panes = {};
  const show = (id) => { for (const k in panes) { panes[k].hidden = k !== id; btns[k].classList.toggle('on', k === id); } body.scrollTop = 0; };
  for (const [id, label, content] of defs) {
    if (!content) continue;
    btns[id] = h('button', { type: 'button', role: 'tab', onclick: () => show(id) }, label);
    panes[id] = h('div', { class: 'pane-content' }, content);
    head.append(btns[id]); body.append(panes[id]);
  }
  show(defs.find((d) => d[2])[0]);
  return h('section', { class: 'pane left' }, head, body);
}
function fillFigs(root) {
  root.querySelectorAll('[data-fig]').forEach((el) => {
    const spec = FIGS[el.dataset.fig];
    if (!spec) return;
    el.classList.add('figure');
    el.innerHTML = staticSVG(specToModel(spec), { maxWidth: el.dataset.w ? +el.dataset.w : 760 }) + (el.dataset.cap ? `<figcaption>${esc(el.dataset.cap)}</figcaption>` : '');
  });
}
// blocos <pre class="run" data-db="..."> viram exemplos executáveis
function fillRunnable(root) {
  root.querySelectorAll('pre.run').forEach((pre) => {
    const db = pre.dataset.db || 'empresa';
    const out = h('div', { class: 'run-out' });
    const btn = h('button', { class: 'btn secondary small', onclick: async () => {
      out.innerHTML = ''; out.append(spinner('Executando…'));
      const r = await runForDisplay(db, '', pre.textContent);
      out.innerHTML = '';
      if (r.error) out.append(h('pre', { class: 'errbox' }, r.error));
      else r.results.filter((x) => x.fields.length).slice(-2).forEach((x) => out.append(resultTable(x)));
    } }, 'Executar');
    const open = h('button', { class: 'btn ghost small', onclick: () => {
      store.set('pg', { db, lang: 'sql' }); store.set('pg:sql:' + db, pre.textContent); location.hash = '#/playground';
    } }, 'Abrir no Playground');
    const wrap = h('div', { class: 'runnable' });
    pre.replaceWith(wrap);
    wrap.append(h('div', { class: 'run-head' }, h('span', {}, 'SQL · banco ' + (DB_INFO[db]?.schema || db)), h('span', { class: 'grow' }), open, btn), pre, out);
  });
}
function pageHead(over, title, meta, right) {
  return h('header', { class: 'page-head' }, h('div', {}, over ? h('div', { class: 'overline' }, over) : null, h('h1', {}, title), meta ? h('p', { class: 'page-meta' }, meta) : null), right || null);
}
function subbar(crumbs, right) {
  return h('div', { class: 'subbar' }, h('nav', { class: 'crumbs', 'aria-label': 'Trilha de navegação' },
    crumbs.flatMap((c, i) => [i ? h('span', { class: 'sep' }, '/') : null, c.href ? h('a', { href: c.href }, c.label) : h('span', { class: 'cur' }, c.label)])),
  h('div', { class: 'subbar-right' }, right || null));
}

// ---------- páginas ----------
function pageHome() {
  app.className = 'app page';
  const next = allLevels().find((l) => !isDone(l.id));
  const diffMs = EXAM - new Date();
  const days = Math.floor(diffMs / 864e5), hours = Math.floor(diffMs / 36e5) % 24;
  const until = diffMs > 0 ? `faltam ${days > 0 ? days + (days === 1 ? ' dia e ' : ' dias e ') : ''}${hours} h` : 'prova realizada';

  const cont = h('section', { class: 'panel' }, h('h2', { class: 'panel-title' }, 'Continuar'),
    next ? h('div', { class: 'continue' },
      h('div', {}, h('div', { class: 'overline' }, `Módulo ${next.wi + 1} · ${next.world.title.replace(/^Mundo [^—]+— /, '')}`),
        h('div', { class: 'continue-title' }, `${next.id}  ${next.title}`),
        h('div', { class: 'meta-row' }, h('span', {}, TYPE_LABEL[next.type]), diff(next.diff), h('span', { class: 'muted' }, next.desc || ''))),
      h('a', { class: 'btn primary', href: '#/nivel/' + next.id }, 'Continuar desafio'))
      : h('div', { class: 'continue' }, h('div', {}, 'Todos os desafios da trilha foram concluídos.'), h('a', { class: 'btn primary', href: '#/boss' }, 'Ir para a avaliação final')));

  const mods = h('section', { class: 'panel' }, h('h2', { class: 'panel-title' }, 'Módulos'),
    h('ol', { class: 'module-list' }, WORLDS.map((w, i) => {
      const done = w.levels.filter((l) => isDone(l.id)).length;
      return h('li', {}, h('a', { href: '#/trilha/' + w.id },
        h('span', { class: 'mod-n' }, i + 1),
        h('span', { class: 'mod-main' }, h('span', { class: 'mod-title' }, w.title.replace(/^Mundo [^—]+— /, '')), h('span', { class: 'mod-desc' }, w.desc)),
        h('span', { class: 'mod-prog' }, bar(done, w.levels.length), h('span', {}, `${done}/${w.levels.length}`))));
    })));

  const bossPanel = h('section', { class: 'panel' }, h('h2', { class: 'panel-title' }, 'Avaliação final'),
    h('p', { class: 'muted small' }, 'Projetos completos no formato da prova: conceitual, lógico, DDL, consultas e gatilho.'),
    h('ul', { class: 'plain-list' }, BOSSES.map((b) => {
      const units = bossUnits().filter((u) => u.startsWith(b.id + '.'));
      const done = units.filter(isDone).length;
      return h('li', {}, h('a', { href: '#/boss/' + b.id }, `${b.n}. ${b.title}`), h('span', { class: 'small muted' }, `${done}/${units.length}`));
    })));

  const exam = h('section', { class: 'panel' }, h('h2', { class: 'panel-title' }, 'Verificação final (VF)'),
    h('dl', { class: 'deflist' },
      h('dt', {}, 'Data'), h('dd', {}, '27/11/2026, 08:00 ', h('span', { class: 'muted' }, `(${until})`)),
      h('dt', {}, 'Local'), h('dd', {}, 'Sala do 3º ano'),
      h('dt', {}, 'Duração'), h('dd', {}, '240 minutos'),
      h('dt', {}, 'Consulta'), h('dd', {}, 'Proibida'),
      h('dt', {}, 'Material'), h('dd', {}, 'Caneta, lápis e borracha')),
    h('p', { class: 'note' }, 'A prova é no papel. Treine também desenhar o ER à mão e escrever SQL sem executar.'));

  const simPanel = h('section', { class: 'panel' }, h('h2', { class: 'panel-title' }, 'Simulado de sintaxe SQL'),
    h('p', { class: 'muted small' }, 'Questões rápidas de DDL, DML, visões e triggers, sem SELECT de consulta. Complete a lacuna, escolha a alternativa ou diga se o comando dá erro.'),
    h('a', { class: 'btn primary small', href: '#/simulado' }, 'Fazer simulado'));

  const exportPanel = h('section', { class: 'panel' }, h('h2', { class: 'panel-title' }, 'Suas respostas'),
    h('p', { class: 'muted small' }, 'Gere um PDF com tudo o que você respondeu, com ou sem gabarito.'),
    h('a', { class: 'btn secondary small', href: '#/respostas' }, 'Exportar respostas em PDF'));

  const keys = h('section', { class: 'panel' }, h('h2', { class: 'panel-title' }, 'Atalhos'),
    h('table', { class: 'keys' }, h('tbody', {},
      [['Ctrl K', 'Buscar desafio ou teoria'], ['Ctrl Enter', 'Executar código'], ['Ctrl Shift Enter', 'Enviar SQL para correção'], ['Del / Ctrl Z', 'Apagar / desfazer no editor ER'], ['Esc', 'Fechar painéis']]
        .map(([k, d]) => h('tr', {}, h('td', {}, k.split(' ').map((x) => h('kbd', {}, x))), h('td', {}, d))))));

  app.append(pageHead('Curso 09913', 'Banco de Dados I — preparação para a VF', 'Modelo ER, modelo relacional, mapeamento, álgebra relacional, SQL (DDL e DML) e triggers, com PostgreSQL rodando no navegador.'),
    h('div', { class: 'dash' }, h('div', { class: 'dash-main' }, cont, mods), h('aside', { class: 'dash-side' }, exam, simPanel, bossPanel, exportPanel, keys)));
}

function pageTrail(focusWorld) {
  app.className = 'app page';
  const f = store.get('trailFilter', { type: 'all', status: 'all' });
  const listWrap = h('div');
  const typeSel = h('select', { class: 'input', 'aria-label': 'Tipo' }, [['all', 'Todos os tipos'], ...Object.entries(TYPE_LABEL)].map(([v, t]) => h('option', { value: v, selected: f.type === v }, t)));
  const statusSel = h('select', { class: 'input', 'aria-label': 'Situação' }, [['all', 'Todas as situações'], ['todo', 'Pendentes'], ['done', 'Concluídos']].map(([v, t]) => h('option', { value: v, selected: f.status === v }, t)));
  const draw = () => {
    f.type = typeSel.value; f.status = statusSel.value; store.set('trailFilter', f);
    listWrap.innerHTML = '';
    WORLDS.forEach((w, wi) => {
      const levels = w.levels.filter((l) => (f.type === 'all' || l.type === f.type) && (f.status === 'all' || (f.status === 'done') === isDone(l.id)));
      if (!levels.length) return;
      const done = w.levels.filter((l) => isDone(l.id)).length;
      listWrap.append(h('section', { class: 'module', id: 'mod-' + w.id },
        h('header', { class: 'module-head' },
          h('div', {}, h('div', { class: 'overline' }, `Módulo ${wi + 1}`), h('h2', {}, w.title.replace(/^Mundo [^—]+— /, '')), h('p', { class: 'muted' }, w.desc)),
          h('div', { class: 'module-side' }, h('span', { class: 'small muted' }, `${done} de ${w.levels.length} concluídos`), bar(done, w.levels.length),
            w.theory ? h('a', { class: 'btn ghost small', href: '#/teoria/' + w.theory }, 'Teoria do módulo') : null)),
        h('table', { class: 'ch-table' },
          h('thead', {}, h('tr', {}, h('th', { class: 'c-status' }, ''), h('th', {}, 'Desafio'), h('th', { class: 'c-type' }, 'Tipo'), h('th', { class: 'c-diff' }, 'Dificuldade'), h('th', { class: 'c-act' }, ''))),
          h('tbody', {}, levels.map((l) => h('tr', {},
            h('td', { class: 'c-status' }, statusDot(isDone(l.id))),
            h('td', {}, h('a', { class: 'ch-title', href: '#/nivel/' + l.id }, h('span', { class: 'ch-id' }, l.id), l.title), h('div', { class: 'ch-desc' }, l.desc || '')),
            h('td', { class: 'c-type' }, TYPE_LABEL[l.type]),
            h('td', { class: 'c-diff' }, diff(l.diff)),
            h('td', { class: 'c-act' }, h('a', { class: 'btn ' + (isDone(l.id) ? 'secondary' : 'primary') + ' small', href: '#/nivel/' + l.id }, isDone(l.id) ? 'Revisar' : 'Resolver'))))))));
    });
    if (!listWrap.children.length) listWrap.append(h('p', { class: 'muted' }, 'Nenhum desafio com esses filtros.'));
  };
  typeSel.onchange = draw; statusSel.onchange = draw;
  app.append(pageHead('Trilha', 'Desafios', 'Organizados pelos assuntos da FOE, do mais simples ao mais difícil em cada módulo.', h('div', { class: 'filters' }, typeSel, statusSel, h('a', { class: 'btn ghost small', href: '#/respostas' }, 'Exportar respostas (PDF)'))), listWrap);
  draw();
  if (focusWorld) setTimeout(() => document.getElementById('mod-' + focusWorld)?.scrollIntoView({ block: 'start' }), 0);
}

function workspaceFor(level, onPass, opts) {
  switch (level.type) {
    case 'quiz': return quizWorkspace(level, onPass);
    case 'er': return erWorkspace(level, onPass, opts);
    case 'map': return mapWorkspace(level, onPass, opts);
    case 'ra': return raWorkspace(level, onPass, opts);
    case 'sql': return sqlWorkspace(level, onPass, opts);
    default: return h('div', {}, 'tipo desconhecido');
  }
}

function pageLevel(id) {
  app.className = 'app full';
  const all = allLevels();
  const idx = all.findIndex((l) => l.id === id);
  const level = all[idx];
  if (!level) { app.className = 'app page'; app.append(h('p', {}, 'Desafio não encontrado.')); return; }
  const next = all[idx + 1], prev = all[idx - 1];
  const nextBtn = h('a', { class: 'btn small ' + (isDone(id) ? 'primary' : 'secondary'), href: next ? '#/nivel/' + next.id : '#/boss' }, next ? 'Próximo' : 'Avaliação final');
  const onPass = (s) => { markDone(id, s); nextBtn.className = 'btn small primary'; statusEl.replaceWith(statusEl = h('span', { class: 'tag ok' }, 'Concluído')); };
  let statusEl = isDone(id) ? h('span', { class: 'tag ok' }, 'Concluído') : h('span', { class: 'tag' }, 'Pendente');

  const problem = h('div', { class: 'problem' },
    h('div', { class: 'overline' }, `Módulo ${level.wi + 1} · ${TYPE_LABEL[level.type]}`),
    h('h1', {}, level.title),
    h('div', { class: 'meta-row' }, diff(level.diff), statusEl, h('span', { class: 'muted' }, level.id)),
    h('div', { class: 'statement', html: level.intro || '' }),
    level.world.theory ? h('p', { class: 'small' }, h('a', { href: '#/teoria/' + (level.theory || level.world.theory) }, 'Revisar a teoria deste assunto')) : null);
  const dbPane = level.db && DB_INFO[level.db] && level.type !== 'quiz' ? h('div', { class: 'statement', html: DB_INFO[level.db].desc }) : null;
  const left = paneTabs([['p', 'Problema', problem], ['s', 'Passo a passo', level.steps?.length ? stepsList(level.steps) : null], ['d', 'Banco de dados', dbPane]]);
  const right = h('section', { class: 'pane right' }, workspaceFor(level, onPass));

  app.append(subbar([{ label: 'Desafios', href: '#/trilha' }, { label: level.world.title.replace(/^Mundo [^—]+— /, ''), href: '#/trilha/' + level.world.id }, { label: level.title }],
    [h('span', { class: 'small muted' }, `${idx + 1} de ${all.length}`), prev ? h('a', { class: 'btn ghost small', href: '#/nivel/' + prev.id }, 'Anterior') : null, nextBtn]),
  h('div', { class: 'split' + (level.type === 'quiz' ? ' quiz-split' : '') }, left, right));
}

function pageTheory(chId) {
  app.className = 'app page';
  const ch = CHAPTERS.find((c) => c.id === chId) || CHAPTERS[0];
  const toc = h('nav', { class: 'outline', 'aria-label': 'Conteúdo' }, h('div', { class: 'outline-title' }, 'Conteúdo'),
    h('ol', {}, CHAPTERS.map((c) => h('li', {}, h('a', { href: '#/teoria/' + c.id, class: c.id === ch.id ? 'on' : '' }, h('span', { class: 'onum' }, c.num), h('span', {}, c.title))))));
  const body = h('article', { class: 'prose' }, h('div', { class: 'overline' }, `Capítulo ${ch.num} · ${ch.foe || ''}`), h('h1', {}, ch.title), h('div', { html: ch.html }));
  // índice da página (h3)
  const prac = (ch.practice || []).map((pid) => allLevels().find((l) => l.id === pid)).filter(Boolean);
  if (prac.length) {
    body.append(h('h2', {}, 'Pratique'), h('table', { class: 'ch-table compact' }, h('tbody', {}, prac.map((l) => h('tr', {},
      h('td', { class: 'c-status' }, statusDot(isDone(l.id))), h('td', {}, h('a', { class: 'ch-title', href: '#/nivel/' + l.id }, h('span', { class: 'ch-id' }, l.id), l.title)), h('td', { class: 'c-diff' }, diff(l.diff)))))));
  }
  const i = CHAPTERS.indexOf(ch);
  body.append(h('nav', { class: 'pager' },
    CHAPTERS[i - 1] ? h('a', { href: '#/teoria/' + CHAPTERS[i - 1].id }, h('span', { class: 'small muted' }, 'Anterior'), h('span', {}, CHAPTERS[i - 1].title)) : h('span'),
    CHAPTERS[i + 1] ? h('a', { class: 'next', href: '#/teoria/' + CHAPTERS[i + 1].id }, h('span', { class: 'small muted' }, 'Próximo'), h('span', {}, CHAPTERS[i + 1].title)) : h('span')));
  const sections = [...body.querySelectorAll('h3')];
  sections.forEach((s, k) => { s.id = 'sec-' + k; });
  const onPage = sections.length > 3 ? h('nav', { class: 'onpage' }, h('div', { class: 'outline-title' }, 'Nesta página'),
    h('ul', {}, sections.map((s) => h('li', {}, h('a', { href: 'javascript:void 0', onclick: () => s.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, s.textContent))))) : h('div');
  app.append(h('div', { class: 'docs' }, toc, body, onPage));
  fillFigs(body);
  fillRunnable(body);
}

function pageBossList() {
  app.className = 'app page';
  app.append(pageHead('Avaliação final', 'Projetos completos', 'Cada projeto segue o formato anunciado para a VF: a partir de um minimundo, entregar o esquema conceitual (ER), o esquema lógico, o DDL, as consultas e um gatilho. Cada seção libera o gabarito da anterior.'));
  app.append(h('table', { class: 'ch-table boss-table' },
    h('thead', {}, h('tr', {}, h('th', {}, 'Projeto'), h('th', {}, 'Conteúdo cobrado'), h('th', { class: 'c-diff' }, 'Dificuldade'), h('th', { class: 'c-prog' }, 'Progresso'), h('th', { class: 'c-act' }, ''))),
    h('tbody', {}, BOSSES.map((b) => {
      const units = bossUnits().filter((u) => u.startsWith(b.id + '.'));
      const done = units.filter(isDone).length;
      return h('tr', {},
        h('td', {}, h('a', { class: 'ch-title', href: '#/boss/' + b.id }, h('span', { class: 'ch-id' }, 'P' + b.n), b.title), h('div', { class: 'ch-desc' }, b.tagline)),
        h('td', { class: 'small' }, b.covers),
        h('td', { class: 'c-diff' }, diff(b.diff)),
        h('td', { class: 'c-prog' }, bar(done, units.length), h('span', { class: 'small muted' }, ` ${done}/${units.length}`)),
        h('td', { class: 'c-act' }, h('a', { class: 'btn primary small', href: '#/boss/' + b.id }, done ? 'Continuar' : 'Iniciar')));
    }))));
  app.append(h('section', { class: 'panel', style: { marginTop: '20px' } }, h('h2', { class: 'panel-title' }, 'Como funciona'),
    h('ol', { class: 'flow' }, ['Modelo conceitual', 'Modelo lógico', 'DDL', 'Consultas', 'Gatilho'].map((s, i) => h('li', {}, h('span', { class: 'step-n' }, i + 1), s)))));
}

function pageBoss(id, phaseIdx) {
  app.className = 'app full';
  const b = BOSSES.find((x) => x.id === id);
  if (!b) { app.className = 'app page'; app.append(h('p', {}, 'Projeto não encontrado.')); return; }
  const pi = Math.min(b.phases.length - 1, Math.max(0, +phaseIdx || 0));
  const ph = b.phases[pi];
  const unitDone = (i) => {
    const p = b.phases[i];
    return p.kind === 'sqlset' ? p.tasks.every((t, j) => isDone(`${b.id}.p${i}.t${j}`)) : isDone(`${b.id}.p${i}`);
  };
  const nextHref = pi < b.phases.length - 1 ? `#/boss/${b.id}/${pi + 1}` : '#/boss';
  const nextBtn = h('a', { class: 'btn small ' + (unitDone(pi) ? 'primary' : 'secondary'), href: nextHref }, pi < b.phases.length - 1 ? 'Próxima seção' : 'Concluir');
  const sections = h('ol', { class: 'stepper' }, b.phases.map((p, i) => h('li', { class: (i === pi ? 'on ' : '') + (unitDone(i) ? 'done' : '') },
    h('a', { href: `#/boss/${b.id}/${i}` }, h('span', { class: 'step-n' }, unitDone(i) ? '✓' : i + 1), h('span', {}, p.title)))));

  const key = `${b.id}.p${pi}`;
  const pass = (k) => (s) => { markDone(k, s); if (unitDone(pi)) nextBtn.className = 'btn small primary'; };
  let ws;
  if (ph.kind === 'er') ws = erWorkspace(ph, pass(key), { storeKey: 'er:' + key });
  else if (ph.kind === 'map') ws = mapWorkspace({ ...ph, diagram: ph.diagram || b.phases.find((p) => p.kind === 'er')?.gabarito }, pass(key), { storeKey: 'map:' + key });
  else if (ph.kind === 'sql') ws = sqlWorkspace(ph, pass(key), { storeKey: 'sql:' + key });
  else if (ph.kind === 'sqlset') {
    ws = h('div', { class: 'workspace' });
    const tabs = h('div', { class: 'task-tabs', role: 'tablist' });
    const task = h('div', { class: 'task-statement' });
    const area = h('div');
    const show = (j) => {
      [...tabs.children].forEach((bt, k) => bt.classList.toggle('on', k === j));
      area.innerHTML = ''; task.innerHTML = '';
      const t = ph.tasks[j];
      const tk = `${key}.t${j}`;
      task.append(h('b', {}, `Consulta ${j + 1}. `), h('span', { html: t.task }));
      area.append(sqlWorkspace({ ...t, db: ph.db, setup: ph.setup, id: tk }, (s) => { markDone(tk, s); tabs.children[j].classList.add('done'); if (unitDone(pi)) nextBtn.className = 'btn small primary'; }, { storeKey: 'sql:' + tk }));
    };
    ph.tasks.forEach((t, j) => tabs.append(h('button', { type: 'button', class: isDone(`${key}.t${j}`) ? 'done' : '', onclick: () => show(j) }, `${j + 1}. ${t.title}`)));
    ws.append(tabs, task, area);
    show(0);
  }
  const intro = h('div', { class: 'problem' }, h('div', { class: 'overline' }, `Seção ${pi + 1} de ${b.phases.length}`), h('h1', {}, ph.title), h('div', { class: 'statement', html: ph.intro || '' }));
  const left = paneTabs([
    ['i', 'Esta seção', intro],
    ['m', 'Minimundo', h('div', { class: 'statement', html: b.story })],
    ['s', 'Passo a passo', ph.steps?.length ? stepsList(ph.steps) : null],
    ['e', 'Esquema de referência', ph.schemaHtml && ph.kind !== 'sql' ? h('div', { class: 'statement', html: ph.schemaHtml }) : null],
  ]);
  app.append(subbar([{ label: 'Avaliação final', href: '#/boss' }, { label: `Projeto ${b.n}: ${b.title}` }],
    [pi > 0 ? h('a', { class: 'btn ghost small', href: `#/boss/${b.id}/${pi - 1}` }, 'Seção anterior') : null, nextBtn]),
  h('div', { class: 'stepper-bar' }, sections),
  h('div', { class: 'split' }, left, h('section', { class: 'pane right' }, ws)));
}

function pagePlayground() {
  app.className = 'app full';
  const st = store.get('pg', { db: 'empresa', lang: 'sql' });
  const sel = h('select', { class: 'input', 'aria-label': 'Banco' }, Object.entries(DB_INFO).map(([k, v]) => h('option', { value: k, selected: k === st.db }, v.label)));
  const langTabs = h('div', { class: 'seg' });
  const left = h('section', { class: 'pane left' });
  const right = h('section', { class: 'pane right' });
  const draw = () => {
    langTabs.innerHTML = '';
    for (const [k, t] of [['sql', 'SQL'], ['ra', 'Álgebra relacional'], ['er', 'Editor ER']]) langTabs.append(h('button', { class: st.lang === k ? 'on' : '', onclick: () => { st.lang = k; store.set('pg', st); draw(); } }, t));
    left.innerHTML = ''; right.innerHTML = '';
    if (st.lang === 'er') {
      const box = h('div', { class: 'ide' });
      right.append(box);
      createEditor(box, { model: store.get('er:free') || emptyModel(), onChange: (m) => store.set('er:free', m), height: Math.max(460, window.innerHeight - 170) });
      left.append(h('div', { class: 'pane-body' }, h('div', { class: 'statement' }, h('h2', {}, 'Editor livre'), h('p', {}, 'Desenhe qualquer diagrama ER. Ele fica salvo neste navegador; use Exportar para guardar o arquivo ou SVG para baixar a imagem.'))));
      return;
    }
    const db = st.lang === 'ra' ? (st.db === 'vazio' ? 'algebra' : st.db) : st.db;
    left.append(h('div', { class: 'pane-body' }, h('div', { class: 'statement' }, h('div', { class: 'overline' }, 'Banco'), sel, h('div', { html: DB_INFO[db].desc }), h('h3', {}, 'Tabelas e colunas')), schemaBrowser(db)));
    if (st.lang === 'ra') right.append(raWorkspace({ id: 'pg', db }, () => {}, { storeKey: 'pg:ra:' + db, free: true }));
    else {
      const ws = h('div', { class: 'workspace' });
      const ide = h('div', { class: 'ide' }, h('div', { class: 'ide-head' }, h('span', { class: 'ide-title' }, 'PostgreSQL'), h('span', { class: 'ide-meta' }, `PGlite · banco ${DB_INFO[db].schema} · recriado a cada execução`)));
      ws.append(ide);
      const ed = codeEditor(ide, { value: store.get('pg:sql:' + db, db === 'empresa' ? 'SELECT nome, snome, salario\nFROM empregado\nORDER BY salario DESC;' : db === 'clube' ? 'SELECT * FROM members LIMIT 10;' : db === 'algebra' ? 'SELECT * FROM empregado;' : "CREATE TABLE teste (id int PRIMARY KEY, nome varchar(30));\nINSERT INTO teste VALUES (1, 'oi');\nSELECT * FROM teste;"), onChange: (v) => store.set('pg:sql:' + db, v) });
      const out = h('div', { class: 'results' }, h('div', { class: 'empty-note' }, 'Execute para ver a saída.'));
      const run = async () => {
        out.innerHTML = ''; out.append(spinner('Executando…'));
        const r = await runForDisplay(db, '', ed.get());
        out.innerHTML = '';
        if (r.error) out.append(h('pre', { class: 'errbox' }, r.error));
        else r.results.filter((x) => x.fields.length || x === r.results[r.results.length - 1]).slice(-6).forEach((x) => out.append(resultTable(x)));
      };
      ed.onKey((e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); } });
      ide.append(h('div', { class: 'ide-foot' }, h('span', { class: 'kbd-hint' }, h('kbd', {}, 'Ctrl'), '+', h('kbd', {}, 'Enter')), h('span', { class: 'muted small' }, 'executa'), h('span', { class: 'grow' }), h('button', { class: 'btn primary', onclick: run }, 'Executar')));
      ws.append(h('div', { class: 'console' }, h('div', { class: 'console-tabs' }, h('button', { class: 'on' }, 'Saída')), h('div', { class: 'console-body' }, h('div', { class: 'console-pane' }, out))));
      right.append(ws);
    }
  };
  sel.onchange = () => { st.db = sel.value; store.set('pg', st); draw(); };
  app.append(subbar([{ label: 'Playground' }], [langTabs]), h('div', { class: 'split' }, left, right));
  draw();
}

// ---------- busca ----------
function searchItems() {
  return [
    ...allLevels().map((l) => ({ kind: 'Desafio', id: l.id, title: l.title, sub: TYPE_LABEL[l.type] + ' ' + (l.desc || ''), href: '#/nivel/' + l.id, done: isDone(l.id) })),
    ...CHAPTERS.map((c) => ({ kind: 'Teoria', id: 'Cap. ' + c.num, title: c.title, sub: c.foe, href: '#/teoria/' + c.id })),
    ...BOSSES.flatMap((b) => b.phases.map((p, i) => ({ kind: 'Projeto', id: `P${b.n}.${i + 1}`, title: `${b.title} — ${p.title}`, href: `#/boss/${b.id}/${i}` }))),
    { kind: 'Ferramenta', id: '', title: 'Playground (SQL, álgebra, ER livre)', href: '#/playground' },
    { kind: 'Ferramenta', id: '', title: 'Exportar respostas em PDF', href: '#/respostas' },
    { kind: 'Ferramenta', id: '', title: 'Simulado de sintaxe SQL (DDL, DML, visões, triggers)', href: '#/simulado' },
  ];
}

// ---------- roteador ----------
function route() {
  const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').map(decodeURIComponent);
  app.innerHTML = '';
  const nav = { '': 'home', trilha: 'trilha', nivel: 'trilha', teoria: 'teoria', boss: 'boss', playground: 'playground', simulado: 'simulado' }[parts[0]] || 'home';
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === nav));
  try {
    switch (parts[0]) {
      case 'trilha': pageTrail(parts[1]); break;
      case 'nivel': pageLevel(parts[1]); break;
      case 'teoria': pageTheory(parts[1]); break;
      case 'boss': parts[1] ? pageBoss(parts[1], parts[2]) : pageBossList(); break;
      case 'playground': pagePlayground(); break;
      case 'respostas': pageExport(app); break;
      case 'simulado': pageSimulado(app); break;
      default: pageHome();
    }
  } catch (e) {
    console.error(e);
    app.append(h('pre', { class: 'errbox' }, 'Erro ao montar a página: ' + e.message));
  }
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
initDock({ getSearchItems: searchItems });
route();
updateXP();
setTimeout(() => getDB().catch(() => toast('Não foi possível carregar o PostgreSQL (sem internet?).', 5000)), 800);
