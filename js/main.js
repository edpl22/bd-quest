// Roteamento e páginas do BD Quest.
import { h, esc, store, toast, codeEditor } from './util.js';
import { quizWorkspace, erWorkspace, mapWorkspace, raWorkspace, sqlWorkspace, schemaBrowser, resultTable } from './workspaces.js';
import { createEditor, specToModel, staticSVG, emptyModel } from './er.js';
import { WORLDS } from './content/levels.js';
import { BOSSES } from './content/bosses.js';
import { CHAPTERS, FIGS } from './content/theory.js';
import { DB_INFO } from './data/seeds.js';
import { runForDisplay } from './sqlcheck.js';
import { getDB } from './db.js';

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
  if (!before) toast(stars >= 3 ? '✓ Nível concluído!' : '✓ Concluído');
}
const isDone = (id) => !!prog()[id];
const allLevels = () => WORLDS.flatMap((w) => w.levels.map((l) => ({ ...l, world: w })));
const bossUnits = () => BOSSES.flatMap((b) => b.phases.flatMap((p, i) => p.kind === 'sqlset' ? p.tasks.map((t, j) => `${b.id}.p${i}.t${j}`) : [`${b.id}.p${i}`]));
function updateXP() {
  const ids = [...allLevels().map((l) => l.id), ...bossUnits()];
  const done = ids.filter(isDone).length;
  const pct = Math.round(100 * done / ids.length);
  document.getElementById('xpfill').style.width = pct + '%';
  document.getElementById('xptext').textContent = pct + '%';
}

// ---------- tema ----------
const themeBtn = document.getElementById('themebtn');
function applyTheme(t) { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }
applyTheme(store.get('theme'));
themeBtn.onclick = () => {
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const t = dark ? 'light' : 'dark';
  store.set('theme', t); applyTheme(t);
};

// ---------- helpers ----------
const TYPE_LABEL = { quiz: 'Quiz', er: 'Modelo ER', map: 'Mapeamento', ra: 'Álgebra', sql: 'SQL' };
const stars = (n) => h('span', { class: 'stars' }, '★'.repeat(n), h('span', { class: 'off' }, '★'.repeat(3 - n)));
function stepsBlock(steps, open = false) {
  if (!steps || !steps.length) return null;
  return h('div', {}, h('h3', {}, 'Passo a passo'), steps.map((s, i) => h('details', { class: 'steps', open: open && i === 0 },
    h('summary', {}, h('span', { class: 'stepnum' }, i + 1), s.t), h('div', { html: s.html }))));
}
function fillFigs(root) {
  root.querySelectorAll('[data-fig]').forEach((el) => {
    const spec = FIGS[el.dataset.fig];
    if (!spec) return;
    el.classList.add('figure');
    el.innerHTML = staticSVG(specToModel(spec), { maxWidth: el.dataset.w ? +el.dataset.w : 760 }) + (el.dataset.cap ? `<div class="cap">${esc(el.dataset.cap)}</div>` : '');
  });
}

// ---------- páginas ----------
function pageHome() {
  const diff = EXAM - new Date();
  const d = Math.max(0, Math.floor(diff / 864e5)), hh = Math.max(0, Math.floor(diff / 36e5) % 24), mm = Math.max(0, Math.floor(diff / 6e4) % 60);
  const next = allLevels().find((l) => !isDone(l.id));
  const foeTopics = [
    ['Conceitos básicos de BD', ['conceitos']],
    ['Arquitetura de BD', ['arquitetura']],
    ['Modelagem conceitual e lógica', ['modelagem']],
    ['Modelo ER', ['er']],
    ['Modelo Relacional', ['relacional']],
    ['Mapeamento ER-Relacional', ['mapeamento']],
    ['Álgebra Relacional', ['algebra']],
    ['SQL DML e DDL', ['ddl', 'dml', 'clube']],
    ['Triggers', ['triggers']],
  ];
  const levelsByTag = (tags) => allLevels().filter((l) => tags.includes(l.tag || l.world.tag));
  app.append(
    h('section', { class: 'hero' },
      h('div', {},
        h('span', { class: 'chip accent' }, '09913 · Banco de Dados I · VF'),
        h('h1', {}, 'Do minimundo ao SQL, passo a passo.'),
        h('p', {}, 'Treino guiado pela FOE: cada assunto tem teoria, níveis com correção automática e um PostgreSQL de verdade rodando no seu navegador. Os 3 bosses finais cobram exatamente o formato da prova: modelo conceitual → lógico → SQL (DDL, DML e gatilho).'),
        h('div', { class: 'pipeline' }, ['Minimundo', 'Conceitual (ER)', 'Lógico (relacional)', 'DDL', 'Consultas', 'Trigger'].flatMap((s, i) => [i ? h('span', { class: 'arrow' }, '→') : null, h('span', { class: 'step' }, s)])),
        h('div', { class: 'btnrow', style: { marginTop: '14px' } },
          next ? h('a', { class: 'btn primary', href: '#/nivel/' + next.id }, (Object.keys(prog()).length ? 'Continuar: ' : 'Começar: ') + next.title) : h('a', { class: 'btn boss', href: '#/boss' }, 'Enfrentar os bosses'),
          h('a', { class: 'btn', href: '#/teoria' }, 'Estudar a teoria'),
          h('a', { class: 'btn boss', href: '#/boss' }, '⚔ Boss final'))),
      h('div', { class: 'card' },
        h('h3', { style: { marginTop: 0 } }, 'Contagem para a VF'),
        h('div', { class: 'countdown' }, h('div', {}, h('b', {}, d), h('span', {}, 'dias')), h('div', {}, h('b', {}, hh), h('span', {}, 'horas')), h('div', {}, h('b', {}, mm), h('span', {}, 'min'))),
        h('p', { class: 'small muted' }, '27/11/2026 · 08:00 · sala 3º ano · 240 min · consulta proibida · levar caneta, lápis e borracha.'),
        h('div', { class: 'callout warn small', html: 'A prova é no papel: treine também <b>desenhar o ER à mão</b> e escrever SQL sem executar. Use o “Ver solução” só depois de tentar.' }))),
    h('div', { class: 'grid cols-2' },
      h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'Assuntos da FOE'),
        h('ul', { class: 'foe-list' }, foeTopics.map(([name, tags]) => {
          const ls = levelsByTag(tags);
          const done = ls.filter((l) => isDone(l.id)).length;
          const ch = CHAPTERS.find((c) => tags.includes(c.id));
          return h('li', {}, h('span', { class: 'name' }, ch ? h('a', { href: '#/teoria/' + ch.id }, name) : name),
            h('span', { class: 'small muted' }, `${done}/${ls.length}`), h('span', { class: 'bar' }, h('i', { style: { width: (ls.length ? 100 * done / ls.length : 0) + '%' } })));
        }))),
      h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'Como usar'),
        h('ol', {},
          h('li', {}, h('b', {}, 'Teoria: '), 'leia o capítulo do assunto (resumo do material de aula, com a notação usada pelo professor).'),
          h('li', {}, h('b', {}, 'Trilha: '), 'resolva os níveis em ordem — cada um tem passo a passo e correção automática.'),
          h('li', {}, h('b', {}, 'Boss: '), 'faça o projeto completo, como na prova. Cada fase libera o gabarito para a próxima.'),
          h('li', {}, h('b', {}, 'Playground: '), 'teste qualquer SQL ou álgebra nos bancos da disciplina.')),
        h('p', { class: 'small muted' }, 'Seu progresso fica salvo neste navegador.'))));
}

function pageTrail() {
  app.append(h('h1', {}, 'Trilha de níveis'), h('p', { class: 'muted' }, 'Dificuldade crescente dentro de cada mundo. Os mundos seguem a ordem dos assuntos da FOE.'));
  for (const w of WORLDS) {
    const done = w.levels.filter((l) => isDone(l.id)).length;
    app.append(h('section', { class: 'world' },
      h('div', { class: 'world-head' }, h('h2', {}, w.title), h('span', { class: 'chip ' + (done === w.levels.length ? 'ok' : '') }, `${done}/${w.levels.length}`),
        h('span', { class: 'muted' }, w.desc), w.theory ? h('a', { class: 'small', href: '#/teoria/' + w.theory }, '📖 teoria') : null),
      h('div', { class: 'levels' }, w.levels.map((l) => {
        const p = prog()[l.id];
        return h('a', { class: 'level-card' + (p ? ' done' : ''), href: '#/nivel/' + l.id },
          h('div', { class: 'top' }, h('span', { class: 'num' }, l.id), h('span', { class: 'chip' }, TYPE_LABEL[l.type]), stars(l.diff || 1),
            h('span', { class: 'status' }, p ? '✅' : '')),
          h('div', { class: 'title' }, l.title), h('div', { class: 'desc' }, l.desc || ''));
      }))));
  }
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
  const all = allLevels();
  const idx = all.findIndex((l) => l.id === id);
  const level = all[idx];
  if (!level) { app.append(h('p', {}, 'Nível não encontrado.')); return; }
  const next = all[idx + 1], prev = all[idx - 1];
  const nextBtn = h('a', { class: 'btn ' + (isDone(id) ? 'ok' : ''), href: next ? '#/nivel/' + next.id : '#/boss' }, next ? 'Próximo nível →' : 'Ir para os bosses →');
  const onPass = (s) => { markDone(id, s); nextBtn.classList.add('ok'); };
  const dbInfo = level.db && DB_INFO[level.db] && level.type !== 'quiz' ? h('details', { class: 'steps' }, h('summary', {}, '🗄 Esquema do banco'), h('div', { class: 'small', html: DB_INFO[level.db].desc })) : null;
  const left = h('div', { class: 'panel sticky' },
    h('div', { class: 'crumbs' }, h('a', { href: '#/trilha' }, 'Trilha'), '›', level.world.title),
    h('div', { class: 'btnrow', style: { marginBottom: '6px' } }, h('span', { class: 'chip' }, TYPE_LABEL[level.type]), stars(level.diff || 1), isDone(id) ? h('span', { class: 'chip ok' }, 'concluído') : null),
    h('h1', {}, `${level.id} · ${level.title}`),
    h('div', { class: 'statement', html: level.intro || '' }),
    dbInfo,
    stepsBlock(level.steps),
    level.world.theory ? h('p', { class: 'small' }, h('a', { href: '#/teoria/' + (level.theory || level.world.theory) }, '📖 Revisar a teoria deste assunto')) : null,
    h('div', { class: 'btnrow', style: { marginTop: '12px' } }, prev ? h('a', { class: 'btn small', href: '#/nivel/' + prev.id }, '← Anterior') : null, nextBtn));
  const layout = h('div', { class: 'level-layout' + (level.type === 'er' || level.type === 'map' ? ' wide' : '') }, left, workspaceFor(level, onPass));
  app.append(layout);
}

function pageTheory(chId) {
  const ch = CHAPTERS.find((c) => c.id === chId) || CHAPTERS[0];
  const toc = h('nav', { class: 'toc panel' }, h('div', { class: 'small muted', style: { padding: '0 10px 6px' } }, 'Conteúdo da FOE'),
    CHAPTERS.map((c) => h('a', { href: '#/teoria/' + c.id, class: c.id === ch.id ? 'active' : '' }, h('span', { class: 'tnum' }, c.num), c.title)));
  const body = h('article', { class: 'prose' }, h('div', { class: 'crumbs' }, 'Teoria', '›', ch.foe || ''), h('h1', {}, `${ch.num}. ${ch.title}`), h('div', { html: ch.html }));
  const prac = (ch.practice || []).map((pid) => allLevels().find((l) => l.id === pid)).filter(Boolean);
  if (prac.length) body.append(h('h3', {}, 'Pratique'), h('div', { class: 'practice-links' }, prac.map((l) => h('a', { class: 'btn small', href: '#/nivel/' + l.id }, `${l.id} ${l.title}`))));
  const i = CHAPTERS.indexOf(ch);
  body.append(h('hr'), h('div', { class: 'btnrow' },
    CHAPTERS[i - 1] ? h('a', { class: 'btn', href: '#/teoria/' + CHAPTERS[i - 1].id }, '← ' + CHAPTERS[i - 1].title) : null,
    CHAPTERS[i + 1] ? h('a', { class: 'btn primary', href: '#/teoria/' + CHAPTERS[i + 1].id }, CHAPTERS[i + 1].title + ' →') : null));
  app.append(h('div', { class: 'theory' }, toc, body));
  fillFigs(body);
}

function pageBossList() {
  app.append(h('div', { class: 'boss-hero' },
    h('span', { class: 'chip boss' }, 'Formato da prova'),
    h('h1', {}, '⚔ Boss final: do conceitual ao SQL'),
    h('p', {}, 'Cada boss é um projeto completo, como o professor anunciou para a VF: você recebe um minimundo e precisa entregar o esquema conceitual (ER, notação brModelo), o esquema lógico (notação resumida), o DDL, as consultas e um gatilho. A dificuldade cresce do 1 ao 3.'),
    h('div', { class: 'pipeline' }, ['1 Conceitual', '2 Lógico', '3 DDL', '4 Consultas', '5 Gatilho'].flatMap((s, i) => [i ? h('span', { class: 'arrow' }, '→') : null, h('span', { class: 'step' }, s)]))));
  app.append(h('div', { class: 'grid cols-3' }, BOSSES.map((b) => {
    const units = bossUnits().filter((u) => u.startsWith(b.id + '.'));
    const done = units.filter(isDone).length;
    return h('a', { class: 'level-card', href: '#/boss/' + b.id },
      h('div', { class: 'top' }, h('span', { class: 'chip boss' }, 'Boss ' + b.n), stars(b.diff), h('span', { class: 'status small muted' }, `${done}/${units.length}`)),
      h('div', { class: 'title' }, b.title), h('div', { class: 'desc' }, b.tagline),
      h('div', { class: 'small muted' }, 'Cobra: ' + b.covers));
  })));
}

function pageBoss(id, phaseIdx) {
  const b = BOSSES.find((x) => x.id === id);
  if (!b) { app.append(h('p', {}, 'Boss não encontrado.')); return; }
  const pi = Math.min(b.phases.length - 1, Math.max(0, +phaseIdx || 0));
  const ph = b.phases[pi];
  const unitDone = (i) => {
    const p = b.phases[i];
    return p.kind === 'sqlset' ? p.tasks.every((t, j) => isDone(`${b.id}.p${i}.t${j}`)) : isDone(`${b.id}.p${i}`);
  };
  app.append(h('div', { class: 'crumbs' }, h('a', { href: '#/boss' }, 'Bosses'), '›', `Boss ${b.n}`));
  app.append(h('h1', {}, `Boss ${b.n}: ${b.title}`));
  app.append(h('div', { class: 'phases' }, b.phases.map((p, i) => h('a', { class: 'phase' + (i === pi ? ' active' : '') + (unitDone(i) ? ' done' : ''), href: `#/boss/${b.id}/${i}` }, h('span', { class: 'pn' }, unitDone(i) ? '✓' : i + 1), p.title))));

  const story = h('details', { class: 'steps', open: pi === 0 }, h('summary', {}, '📜 Minimundo (enunciado completo)'), h('div', { class: 'statement', html: b.story }));
  const nextBtn = h('a', { class: 'btn ' + (unitDone(pi) ? 'ok' : ''), href: pi < b.phases.length - 1 ? `#/boss/${b.id}/${pi + 1}` : '#/boss' }, pi < b.phases.length - 1 ? 'Próxima fase →' : 'Voltar aos bosses');
  const left = h('div', { class: 'panel sticky' }, story, h('h2', { style: { marginTop: '10px' } }, ph.title), h('div', { class: 'statement', html: ph.intro || '' }),
    ph.db && ph.kind !== 'er' && ph.kind !== 'map' && ph.schemaHtml ? h('details', { class: 'steps' }, h('summary', {}, '🗄 Esquema de referência'), h('div', { class: 'small', html: ph.schemaHtml })) : null,
    stepsBlock(ph.steps), h('div', { class: 'btnrow', style: { marginTop: '12px' } }, pi > 0 ? h('a', { class: 'btn small', href: `#/boss/${b.id}/${pi - 1}` }, '← Fase anterior') : null, nextBtn));

  let ws;
  const key = `${b.id}.p${pi}`;
  const pass = (k) => (s) => { markDone(k, s); if (unitDone(pi)) nextBtn.classList.add('ok'); };
  if (ph.kind === 'er') ws = erWorkspace(ph, pass(key), { storeKey: 'er:' + key });
  else if (ph.kind === 'map') ws = mapWorkspace({ ...ph, diagram: ph.diagram || b.phases.find((p) => p.kind === 'er')?.gabarito }, pass(key), { storeKey: 'map:' + key });
  else if (ph.kind === 'sql') ws = sqlWorkspace(ph, pass(key), { storeKey: 'sql:' + key });
  else if (ph.kind === 'sqlset') {
    ws = h('div', { class: 'workspace' });
    const tabs = h('div', { class: 'task-tabs' });
    const area = h('div');
    const show = (j) => {
      tabs.querySelectorAll('button').forEach((bt, k) => bt.classList.toggle('on', k === j));
      area.innerHTML = '';
      const t = ph.tasks[j];
      const tk = `${key}.t${j}`;
      area.append(h('div', { class: 'callout' }, h('b', {}, `Consulta ${j + 1}: `), h('span', { html: t.task })),
        sqlWorkspace({ ...t, db: ph.db, setup: ph.setup, id: tk }, (s) => { markDone(tk, s); tabs.children[j].classList.add('done'); if (unitDone(pi)) nextBtn.classList.add('ok'); }, { storeKey: 'sql:' + tk }));
    };
    ph.tasks.forEach((t, j) => tabs.append(h('button', { type: 'button', class: isDone(`${key}.t${j}`) ? 'done' : '', onclick: () => show(j) }, `${j + 1}. ${t.title}`)));
    ws.append(tabs, area);
    show(0);
  }
  app.append(h('div', { class: 'level-layout wide' }, left, ws));
}

function pagePlayground() {
  const st = store.get('pg', { db: 'empresa', lang: 'sql' });
  app.append(h('h1', {}, 'Playground'), h('p', { class: 'muted' }, 'PostgreSQL real rodando no navegador (PGlite). O banco é recriado a cada execução — nada que você faça aqui afeta os exercícios.'));
  const sel = h('select', { class: 'input' }, Object.entries(DB_INFO).map(([k, v]) => h('option', { value: k, selected: k === st.db }, v.label)));
  const langSel = h('div', { class: 'tabs' });
  const area = h('div');
  const side = h('div', { class: 'panel sticky' });
  const draw = () => {
    langSel.innerHTML = '';
    for (const [k, t] of [['sql', 'SQL'], ['ra', 'Álgebra relacional'], ['er', 'Editor ER livre']]) langSel.append(h('button', { class: st.lang === k ? 'on' : '', onclick: () => { st.lang = k; store.set('pg', st); draw(); } }, t));
    area.innerHTML = ''; side.innerHTML = '';
    if (st.lang === 'er') {
      const box = h('div');
      area.append(box);
      createEditor(box, { model: store.get('er:free') || emptyModel(), onChange: (m) => store.set('er:free', m) });
      side.append(h('h3', { style: { marginTop: 0 } }, 'Editor livre'), h('p', { class: 'small' }, 'Desenhe qualquer diagrama ER. Ele fica salvo neste navegador; use Exportar para guardar o arquivo.'));
      return;
    }
    const db = st.lang === 'ra' ? (st.db === 'vazio' ? 'algebra' : st.db) : st.db;
    side.append(h('h3', { style: { marginTop: 0 } }, 'Banco'), sel, h('div', { class: 'small', style: { marginTop: '8px' }, html: DB_INFO[db].desc }), h('h3', {}, 'Tabelas e colunas'), schemaBrowser(db));
    if (st.lang === 'ra') area.append(raWorkspace({ id: 'pg', db }, () => {}, { storeKey: 'pg:ra:' + db, free: true }));
    else {
      const ed = codeEditor(area, { value: store.get('pg:sql:' + db, db === 'empresa' ? 'SELECT nome, snome, salario\nFROM empregado\nORDER BY salario DESC;' : db === 'clube' ? 'SELECT * FROM members LIMIT 10;' : db === 'algebra' ? 'SELECT * FROM empregado;' : 'CREATE TABLE teste (id int PRIMARY KEY, nome varchar(30));\nINSERT INTO teste VALUES (1, \'oi\');\nSELECT * FROM teste;'), onChange: (v) => store.set('pg:sql:' + db, v) });
      const out = h('div', { class: 'results' });
      const run = async () => {
        out.innerHTML = '';
        const r = await runForDisplay(db, '', ed.get());
        if (r.error) out.append(h('div', { class: 'errbox' }, r.error));
        else r.results.filter((x) => x.fields.length || x === r.results[r.results.length - 1]).slice(-6).forEach((x) => out.append(resultTable(x)));
      };
      ed.onKey((e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); } });
      area.append(h('div', { class: 'btnrow', style: { margin: '10px 0' } }, h('button', { class: 'btn primary', onclick: run }, '▶ Executar'), h('span', { class: 'kbd-legend' }, h('kbd', {}, 'Ctrl'), '+', h('kbd', {}, 'Enter'))), out);
    }
  };
  sel.onchange = () => { st.db = sel.value; store.set('pg', st); draw(); };
  app.append(langSel, h('div', { class: 'level-layout wide' }, side, area));
  draw();
}

// ---------- roteador ----------
function route() {
  const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').map(decodeURIComponent);
  app.innerHTML = '';
  const nav = { '': 'home', trilha: 'trilha', nivel: 'trilha', teoria: 'teoria', boss: 'boss', playground: 'playground' }[parts[0]] || 'home';
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === nav));
  try {
    switch (parts[0]) {
      case 'trilha': pageTrail(); break;
      case 'nivel': pageLevel(parts[1]); break;
      case 'teoria': pageTheory(parts[1]); break;
      case 'boss': parts[1] ? pageBoss(parts[1], parts[2]) : pageBossList(); break;
      case 'playground': pagePlayground(); break;
      default: pageHome();
    }
  } catch (e) {
    console.error(e);
    app.append(h('div', { class: 'errbox' }, 'Erro ao montar a página: ' + e.message));
  }
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
route();
updateXP();
// pré-carrega o PostgreSQL em segundo plano
setTimeout(() => getDB().catch(() => toast('Não foi possível carregar o PostgreSQL (sem internet?).', 5000)), 800);
