// Áreas de trabalho de cada tipo de exercício: quiz, ER, mapeamento, álgebra, SQL.
import { h, esc, store, toast, codeEditor, feedbackBox, spinner } from './util.js';
import { createEditor, checkModel, specToModel, staticSVG, emptyModel } from './er.js';
import { parseSchema, renderSchema, checkSchema, cleanGabarito } from './relational.js';
import { translate, loadCatalog, RA_SYMBOLS, RAError } from './algebra.js';
import { gradeSQL, runForDisplay, expectedResult } from './sqlcheck.js';
import { serial, resetTo, query, runScript, errMsg } from './db.js';
import { DB_INFO } from './data/seeds.js';

// ---------- tabelas de resultado ----------
export function resultTable(r, title) {
  const block = h('div', { class: 'result-block' });
  const n = r.rows.length;
  block.append(h('div', { class: 'result-head' }, title ? h('b', {}, title) : null,
    r.fields.length ? `${n} linha${n === 1 ? '' : 's'}` : `comando executado${r.affectedRows ? ` — ${r.affectedRows} linha(s) afetada(s)` : ''}`));
  if (!r.fields.length) return block;
  const table = h('table', { class: 'data' },
    h('thead', {}, h('tr', {}, r.fields.map((f) => h('th', {}, f)))),
    h('tbody', {}, r.rows.slice(0, 500).map((row) => h('tr', {}, row.map((v) => v === null ? h('td', { class: 'null' }, 'null') : h('td', {}, typeof v === 'object' ? JSON.stringify(v) : String(v)))))));
  block.append(h('div', { class: 'result-scroll' }, table));
  if (n > 500) block.append(h('div', { class: 'result-head' }, `… mostrando 500 de ${n}`));
  return block;
}

function showResults(box, results) {
  box.innerHTML = '';
  const shown = results.filter((r) => r.fields.length);
  const list = shown.length ? shown.slice(-4) : results.slice(-1);
  list.forEach((r) => box.append(resultTable(r)));
}

// ---------- quiz ----------
export function quizWorkspace(level, onPass) {
  const root = h('div', { class: 'panel' });
  const answers = {};
  const qs = level.questions;
  qs.forEach((q, qi) => {
    const qd = h('div', { class: 'quiz-q' });
    qd.append(h('div', { class: 'qtext', html: `${qi + 1}. ${q.q}` }));
    q.opts.forEach((o, oi) => {
      const inp = h('input', { type: 'radio', name: `${level.id}-q${qi}`, value: oi });
      const lab = h('label', { class: 'quiz-opt' }, inp, h('span', { html: o }));
      inp.onchange = () => { answers[qi] = oi; };
      qd.append(lab);
    });
    qd.append(h('div', { class: 'quiz-exp', html: q.exp || '' }));
    root.append(qd);
  });
  const fb = h('div');
  root.append(h('div', { class: 'btnrow' }, h('button', {
    class: 'btn primary',
    onclick: () => {
      let right = 0;
      root.querySelectorAll('.quiz-q').forEach((qd, qi) => {
        qd.classList.add('answered');
        qd.querySelectorAll('.quiz-opt').forEach((lab, oi) => {
          lab.classList.remove('right', 'wrong');
          if (oi === qs[qi].a) lab.classList.add('right');
          else if (answers[qi] === oi) lab.classList.add('wrong');
        });
        if (answers[qi] === qs[qi].a) right++;
      });
      const pass = right === qs.length;
      const need = level.need ?? qs.length;
      fb.innerHTML = '';
      fb.append(feedbackBox(right >= need, `${right} de ${qs.length} corretas`, right >= need ? [] : [{ status: 'info', text: 'Leia as explicações abaixo de cada questão e tente de novo.' }]));
      if (right >= need) onPass(pass ? 3 : 2);
    },
  }, 'Corrigir')), fb);
  return root;
}

// ---------- ER ----------
export function erWorkspace(level, onPass, { storeKey } = {}) {
  const key = storeKey || 'er:' + level.id;
  const root = h('div', { class: 'workspace' });
  const saved = store.get(key);
  const ed = createEditor(root, { model: saved || level.start || emptyModel(), onChange: (m) => store.set(key, m) });
  const fb = h('div');
  const gab = h('div');
  root.append(h('div', { class: 'btnrow' },
    h('button', { class: 'btn primary', onclick: () => {
      const r = checkModel(ed.model, level.gabarito);
      fb.innerHTML = '';
      fb.append(feedbackBox(r.pass, r.pass ? 'Modelo conceitual correto!' : 'Ainda há problemas no modelo', r.items));
      if (r.pass) onPass(3);
    } }, 'Verificar modelo'),
    h('button', { class: 'btn', onclick: () => {
      gab.innerHTML = '';
      const m = specToModel(level.gabarito);
      const box = h('div', { class: 'panel' }, h('h3', { style: { marginTop: 0 } }, 'Gabarito comentado'));
      gab.append(box);
      const ro = h('div');
      box.append(ro);
      createEditor(ro, { model: m, readonly: true, height: 420 });
      if (level.explain) box.append(h('div', { class: 'statement', html: level.explain }));
      box.append(h('div', { class: 'btnrow', style: { marginTop: '10px' } },
        h('button', { class: 'btn small', onclick: () => { if (confirm('Substituir seu diagrama pelo gabarito?')) { ed.set(m); store.set(key, m); } } }, 'Carregar gabarito no editor'),
        h('button', { class: 'btn small', onclick: () => { onPass(1); toast('Marcado como concluído.'); } }, 'Entendi — marcar como concluído')));
      gab.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } }, 'Ver gabarito')), fb, gab);
  return root;
}

// ---------- mapeamento ER -> relacional ----------
export function mapWorkspace(level, onPass, { storeKey } = {}) {
  const key = storeKey || 'map:' + level.id;
  const root = h('div', { class: 'workspace' });
  if (level.diagram) {
    const d = h('div');
    root.append(h('div', { class: 'small muted' }, 'Esquema conceitual de entrada:'), d);
    createEditor(d, { model: specToModel(level.diagram), readonly: true, height: level.diagramHeight || 360 });
  }
  root.append(h('div', { class: 'small muted', html: 'Escreva o esquema na <b>notação resumida</b>: <code>TABELA (#chave, atributo, ...)</code> e, abaixo, <code>atributo referencia TABELA</code>. Use <code>#</code> para cada atributo da chave primária.' }));
  const preview = h('div');
  const ed = codeEditor(root, {
    value: store.get(key, level.starter || ''), mode: null, minLines: 10,
    placeholder: 'EMPREGADO (#matricula, nome, salario, sigla)\n  sigla referencia DEPARTAMENTO',
    onChange: (v) => { store.set(key, v); upd(v); },
  });
  const upd = (v) => { preview.innerHTML = ''; preview.append(renderSchema(parseSchema(v))); };
  upd(ed.get());
  const fb = h('div');
  const gab = h('div');
  root.append(h('div', { class: 'small muted' }, 'Pré-visualização:'), preview,
    h('div', { class: 'btnrow' },
      h('button', { class: 'btn primary', onclick: () => {
        const r = checkSchema(ed.get(), level.gabarito);
        fb.innerHTML = '';
        fb.append(feedbackBox(r.pass, r.pass ? 'Esquema lógico correto!' : 'Ainda há diferenças em relação ao gabarito', r.items));
        if (r.pass) onPass(3);
      } }, 'Verificar esquema'),
      h('button', { class: 'btn', onclick: () => {
        gab.innerHTML = '';
        const txt = cleanGabarito(level.gabarito).trim();
        gab.append(h('div', { class: 'panel' }, h('h3', { style: { marginTop: 0 } }, 'Gabarito'), h('pre', {}, txt),
          renderSchema(parseSchema(txt)),
          level.explain ? h('div', { class: 'statement', html: level.explain }) : null,
          h('div', { class: 'btnrow', style: { marginTop: '10px' } },
            h('button', { class: 'btn small', onclick: () => { ed.set(txt); } }, 'Copiar gabarito para o editor'),
            h('button', { class: 'btn small', onclick: () => { onPass(1); toast('Marcado como concluído.'); } }, 'Entendi — marcar como concluído'))));
      } }, 'Ver gabarito')), fb, gab);
  return root;
}

// ---------- álgebra relacional ----------
let catalogCache = {};
export function raWorkspace(level, onPass, { storeKey, free = false } = {}) {
  const key = storeKey || 'ra:' + level.id;
  const db = level.db || 'algebra';
  const schema = DB_INFO[db].schema;
  const root = h('div', { class: 'workspace' });
  const sym = h('div', { class: 'symbar' });
  root.append(sym);
  const ed = codeEditor(root, { value: store.get(key, level.starter || ''), mode: null, onChange: (v) => store.set(key, v), placeholder: 'π pnome, snome (σ salario > 30000 (EMPREGADO))' });
  for (const [s, t] of RA_SYMBOLS) sym.append(h('button', { type: 'button', title: t, onclick: () => ed.insert(s + ' ') }, s));
  const out = h('div', { class: 'results' });
  const fb = h('div');
  const sqlBox = h('details', { class: 'steps' }, h('summary', {}, 'SQL equivalente gerado'), h('div', {}, h('pre', {}, '')));

  async function run(grade) {
    out.innerHTML = ''; fb.innerHTML = '';
    out.append(spinner('Executando no PostgreSQL…'));
    try {
      const res = await serial(async () => {
        await resetTo(db);
        if (!catalogCache[schema]) catalogCache[schema] = await loadCatalog(query, schema);
        const tr = translate(ed.get(), catalogCache[schema], schema);
        sqlBox.querySelector('pre').textContent = tr.sql;
        const mine = await query(tr.sql);
        let expected = null;
        if (grade && level.solution) expected = await query(level.solution);
        return { mine, expected };
      });
      out.innerHTML = '';
      out.append(resultTable(res.mine, 'Seu resultado'));
      if (grade && res.expected) {
        const { compareResults } = await import('./db.js');
        const cmp = compareResults(res.mine, res.expected);
        fb.append(feedbackBox(cmp.ok, cmp.ok ? 'Expressão correta!' : 'Resultado diferente do esperado', cmp.ok ? [] : [{ status: 'err', text: cmp.msg }]));
        if (!cmp.ok) out.append(resultTable(res.expected, 'Resultado esperado'));
        if (cmp.ok) onPass(3);
      }
    } catch (e) {
      out.innerHTML = '';
      out.append(h('div', { class: 'errbox' }, e instanceof RAError ? 'Álgebra: ' + e.message : errMsg(e)));
    }
  }
  const sol = h('div');
  root.append(h('div', { class: 'btnrow' },
    h('button', { class: 'btn', onclick: () => run(false) }, '▶ Executar'),
    free ? null : h('button', { class: 'btn primary', onclick: () => run(true) }, 'Verificar'),
    free || !level.raSolution ? null : h('button', { class: 'btn ghost', onclick: () => {
      sol.innerHTML = '';
      sol.append(h('div', { class: 'callout ok' }, h('b', {}, 'Uma solução: '), h('pre', {}, level.raSolution), level.explain ? h('div', { html: level.explain }) : null));
    } }, 'Ver solução'),
    h('span', { class: 'kbd-legend' }, h('kbd', {}, 'Ctrl'), '+', h('kbd', {}, 'Enter'), ' executa')), fb, sol, out, sqlBox);
  ed.onKey((e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(!free); } });
  return root;
}

// ---------- SQL ----------
export function sqlWorkspace(level, onPass, { storeKey } = {}) {
  const key = storeKey || 'sql:' + level.id;
  const root = h('div', { class: 'workspace' });
  const ed = codeEditor(root, { value: store.get(key, level.starter || ''), onChange: (v) => store.set(key, v), placeholder: '-- escreva seu SQL aqui' });
  const out = h('div', { class: 'results' });
  const fb = h('div');
  const sol = h('div');
  async function exec() {
    out.innerHTML = ''; out.append(spinner('Executando no PostgreSQL (navegador)…'));
    const r = await runForDisplay(level.db, level.setup, ed.get());
    out.innerHTML = '';
    if (r.error) out.append(h('div', { class: 'errbox' }, r.error));
    else showResults(out, r.results);
  }
  async function verify() {
    fb.innerHTML = ''; out.innerHTML = ''; fb.append(spinner('Corrigindo…'));
    const r = await gradeSQL(level, ed.get());
    fb.innerHTML = '';
    fb.append(feedbackBox(r.pass, r.pass ? 'Correto!' : 'Ainda não…', r.items));
    if (r.userResults) showResults(out, r.userResults);
    if (!r.pass && r.expected) out.append(resultTable(r.expected, 'Resultado esperado'));
    if (r.pass) onPass(3);
  }
  root.append(h('div', { class: 'btnrow' },
    h('button', { class: 'btn', onclick: exec }, '▶ Executar'),
    h('button', { class: 'btn primary', onclick: verify }, 'Verificar'),
    level.mode !== 'script' ? h('button', { class: 'btn ghost', onclick: async () => {
      out.innerHTML = ''; out.append(spinner());
      try { const r = await expectedResult(level); out.innerHTML = ''; out.append(resultTable(r, 'Resultado esperado')); } catch (e) { out.innerHTML = ''; out.append(h('div', { class: 'errbox' }, errMsg(e))); }
    } }, 'Ver resultado esperado') : null,
    h('button', { class: 'btn ghost', onclick: () => {
      sol.innerHTML = '';
      sol.append(h('div', { class: 'callout ok' }, h('b', {}, 'Solução de referência:'), h('pre', {}, level.solution.trim()), level.explain ? h('div', { html: level.explain }) : null,
        h('div', { class: 'btnrow' }, h('button', { class: 'btn small', onclick: () => ed.set(level.solution.trim()) }, 'Copiar para o editor'))));
    } }, 'Ver solução'),
    h('span', { class: 'kbd-legend' }, h('kbd', {}, 'Ctrl'), '+', h('kbd', {}, 'Enter'), ' executa')),
  fb, sol, out);
  ed.onKey((e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); exec(); } });
  return root;
}

export function schemaBrowser(dbName) {
  const box = h('div', { class: 'schema-list' }, spinner('Lendo esquema…'));
  serial(async () => {
    await resetTo(dbName);
    const schema = DB_INFO[dbName].schema;
    return query(`SELECT table_name, string_agg(column_name || ' ' || data_type, ', ' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema='${schema}' GROUP BY table_name ORDER BY table_name`);
  }).then((r) => {
    box.innerHTML = '';
    for (const [t, cols] of r.rows) {
      box.append(h('details', {}, h('summary', {}, t), h('ul', {}, cols.split(', ').map((c) => h('li', {}, c)))));
    }
  }).catch((e) => { box.innerHTML = ''; box.append(h('div', { class: 'errbox' }, errMsg(e))); });
  return box;
}

export { staticSVG, specToModel, runScript };
