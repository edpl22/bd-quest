// Áreas de trabalho de cada tipo de exercício: quiz, ER, mapeamento, álgebra, SQL.
// Layout no estilo de plataformas de desafios: editor + barra de ações + console com abas.
import { h, store, toast, codeEditor, feedbackBox, spinner, tabbed, emptyNote } from './util.js';
import { createEditor, checkModel, specToModel, staticSVG, emptyModel } from './er.js';
import { parseSchema, renderSchema, checkSchema, cleanGabarito } from './relational.js';
import { translate, loadCatalog, RA_SYMBOLS, RAError } from './algebra.js';
import { gradeSQL, runForDisplay, expectedResult } from './sqlcheck.js';
import { serial, resetTo, query, runScript, errMsg, compareResults } from './db.js';
import { DB_INFO } from './data/seeds.js';

// ---------- tabelas de resultado ----------
export function resultTable(r, title) {
  const block = h('div', { class: 'result-block' });
  const n = r.rows.length;
  block.append(h('div', { class: 'result-head' }, title ? h('b', {}, title) : null,
    h('span', {}, r.fields.length ? `${n} linha${n === 1 ? '' : 's'}` : `comando executado${r.affectedRows ? ` · ${r.affectedRows} linha(s) afetada(s)` : ''}`)));
  if (!r.fields.length) return block;
  const table = h('table', { class: 'data' },
    h('thead', {}, h('tr', {}, r.fields.map((f) => h('th', {}, f)))),
    h('tbody', {}, r.rows.slice(0, 500).map((row) => h('tr', {}, row.map((v) => v === null ? h('td', { class: 'null' }, 'NULL') : h('td', {}, typeof v === 'object' ? JSON.stringify(v) : String(v)))))));
  block.append(h('div', { class: 'result-scroll' }, table));
  if (n > 500) block.append(h('div', { class: 'result-foot' }, `mostrando 500 de ${n}`));
  return block;
}

function showResults(box, results) {
  box.innerHTML = '';
  const shown = results.filter((r) => r.fields.length);
  const list = shown.length ? shown.slice(-4) : results.slice(-1);
  list.forEach((r) => box.append(resultTable(r)));
}

const errBox = (msg) => h('pre', { class: 'errbox' }, msg);
const kbd = (...keys) => h('span', { class: 'kbd-hint' }, keys.flatMap((k, i) => [i ? '+' : null, h('kbd', {}, k)]));

function ideShell({ title, meta, extra }) {
  const head = h('div', { class: 'ide-head' }, h('span', { class: 'ide-title' }, title), meta ? h('span', { class: 'ide-meta' }, meta) : null, h('span', { class: 'grow' }), extra || null);
  const foot = h('div', { class: 'ide-foot' });
  const root = h('div', { class: 'ide' }, head);
  return { root, head, foot };
}

function revealBlock(label, build) {
  const box = h('div', { class: 'reveal' });
  const btn = h('button', { class: 'btn secondary', onclick: () => { box.innerHTML = ''; box.append(build()); } }, label);
  box.append(h('p', { class: 'muted' }, 'Tente resolver antes de olhar. A solução fica disponível a qualquer momento.'), btn);
  return box;
}

// ---------- quiz ----------
export function quizWorkspace(level, onPass) {
  const root = h('div', { class: 'quiz' });
  const answers = {};
  const qs = level.questions;
  qs.forEach((q, qi) => {
    const qd = h('fieldset', { class: 'quiz-q' });
    qd.append(h('legend', {}, h('span', { class: 'qnum' }, `Questão ${qi + 1} de ${qs.length}`)), h('div', { class: 'qtext', html: q.q }));
    q.opts.forEach((o, oi) => {
      const inp = h('input', { type: 'radio', name: `${level.id}-q${qi}`, value: oi });
      const lab = h('label', { class: 'quiz-opt' }, inp, h('span', { class: 'opt-letter' }, 'ABCDE'[oi]), h('span', { html: o }));
      inp.onchange = () => { answers[qi] = oi; };
      qd.append(lab);
    });
    qd.append(h('div', { class: 'quiz-exp', html: q.exp || '' }));
    root.append(qd);
  });
  const fb = h('div');
  const submit = () => {
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
    const need = level.need ?? qs.length;
    fb.innerHTML = '';
    fb.append(feedbackBox(right >= need, `${right} de ${qs.length} questões corretas`,
      qs.map((q, i) => ({ status: answers[i] === q.a ? 'ok' : 'err', text: `Questão ${i + 1}` + (answers[i] === undefined ? ' — sem resposta' : '') }))));
    fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (right >= need) onPass(right === qs.length ? 3 : 2);
  };
  root.append(h('div', { class: 'ide-foot sticky-foot' }, h('span', { class: 'muted small' }, 'As explicações aparecem depois do envio.'), h('span', { class: 'grow' }),
    h('button', { class: 'btn primary', onclick: submit }, 'Enviar respostas')), fb);
  return root;
}

// ---------- ER ----------
export function erWorkspace(level, onPass, { storeKey } = {}) {
  const key = storeKey || 'er:' + level.id;
  const { root, foot } = ideShell({ title: 'Editor de esquema conceitual', meta: 'Modelo ER · notação brModelo (Heuser)' });
  const area = h('div', { class: 'ide-canvas' });
  root.append(area);
  const ed = createEditor(area, { model: store.get(key) || level.start || emptyModel(), onChange: (m) => store.set(key, m) });
  const con = tabbed([['tests', 'Resultado'], ['gab', 'Gabarito']]);
  con.pane('tests').append(emptyNote('Monte o diagrama e clique em Enviar para corrigir.'));
  con.pane('gab').append(revealBlock('Mostrar gabarito comentado', () => {
    const m = specToModel(level.gabarito);
    const box = h('div');
    const ro = h('div');
    box.append(ro);
    createEditor(ro, { model: m, readonly: true, height: 420 });
    if (level.explain) box.append(h('div', { class: 'prose-sm', html: level.explain }));
    box.append(h('div', { class: 'btnrow' },
      h('button', { class: 'btn secondary', onclick: () => { if (confirm('Substituir seu diagrama pelo gabarito?')) { ed.set(m); store.set(key, m); } } }, 'Carregar no editor'),
      h('button', { class: 'btn ghost', onclick: () => { onPass(1); toast('Marcado como concluído.'); } }, 'Marcar como concluído')));
    return box;
  }));
  const submit = () => {
    const r = checkModel(ed.model, level.gabarito);
    con.pane('tests').innerHTML = '';
    con.pane('tests').append(feedbackBox(r.pass, r.pass ? 'O modelo atende ao minimundo.' : 'O modelo ainda diverge do gabarito.', r.items));
    con.show('tests');
    con.el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (r.pass) onPass(3);
  };
  foot.append(h('span', { class: 'muted small' }, 'Salvo automaticamente neste navegador'), h('span', { class: 'grow' }),
    h('button', { class: 'btn primary', onclick: submit }, 'Enviar modelo'));
  root.append(foot);
  return h('div', { class: 'workspace' }, root, con.el);
}

// ---------- mapeamento ER -> relacional ----------
export function mapWorkspace(level, onPass, { storeKey } = {}) {
  const key = storeKey || 'map:' + level.id;
  const wrap = h('div', { class: 'workspace' });
  if (level.diagram) {
    const d = h('div');
    wrap.append(h('details', { class: 'block', open: true }, h('summary', {}, 'Esquema conceitual de entrada'), d));
    createEditor(d, { model: specToModel(level.diagram), readonly: true, height: level.diagramHeight || 360 });
  }
  const { root, foot } = ideShell({ title: 'Esquema lógico', meta: 'Notação resumida: TABELA (#chave, atributo)  ·  atributo referencia TABELA' });
  wrap.append(root);
  const con = tabbed([['preview', 'Pré-visualização'], ['tests', 'Resultado'], ['gab', 'Gabarito']]);
  const ed = codeEditor(root, {
    value: store.get(key, level.starter || ''), mode: null, minLines: 10,
    placeholder: 'EMPREGADO (#matricula, nome, salario, sigla)\n  sigla referencia DEPARTAMENTO',
    onChange: (v) => { store.set(key, v); upd(v); },
  });
  const upd = (v) => { const p = con.pane('preview'); p.innerHTML = ''; p.append(renderSchema(parseSchema(v))); };
  upd(ed.get());
  con.pane('tests').append(emptyNote('Escreva o esquema e clique em Enviar para corrigir.'));
  con.pane('gab').append(revealBlock('Mostrar gabarito', () => {
    const txt = cleanGabarito(level.gabarito).trim();
    return h('div', {}, h('pre', { class: 'code' }, txt), renderSchema(parseSchema(txt)),
      level.explain ? h('div', { class: 'prose-sm', html: level.explain }) : null,
      h('div', { class: 'btnrow' },
        h('button', { class: 'btn secondary', onclick: () => ed.set(txt) }, 'Copiar para o editor'),
        h('button', { class: 'btn ghost', onclick: () => { onPass(1); toast('Marcado como concluído.'); } }, 'Marcar como concluído')));
  }));
  const submit = () => {
    const r = checkSchema(ed.get(), level.gabarito);
    con.pane('tests').innerHTML = '';
    con.pane('tests').append(feedbackBox(r.pass, r.pass ? 'Esquema lógico correto.' : 'Há diferenças em relação ao gabarito.', r.items));
    con.show('tests');
    if (r.pass) onPass(3);
  };
  foot.append(h('span', { class: 'muted small' }, 'Use # antes de cada atributo da chave primária'), h('span', { class: 'grow' }),
    h('button', { class: 'btn primary', onclick: submit }, 'Enviar esquema'));
  root.append(foot);
  wrap.append(con.el);
  return wrap;
}

// ---------- álgebra relacional ----------
const catalogCache = {};
export function raWorkspace(level, onPass, { storeKey, free = false } = {}) {
  const key = storeKey || 'ra:' + level.id;
  const db = level.db || 'algebra';
  const schema = DB_INFO[db].schema;
  const { root, foot } = ideShell({ title: 'Álgebra relacional', meta: `traduzida para SQL · banco ${schema}` });
  const sym = h('div', { class: 'symbar' });
  root.append(sym);
  const ed = codeEditor(root, { value: store.get(key, level.starter || ''), mode: null, onChange: (v) => store.set(key, v), placeholder: 'π pnome, snome (σ salario > 30000 (EMPREGADO))' });
  for (const [s, t] of RA_SYMBOLS) sym.append(h('button', { type: 'button', title: t, onclick: () => ed.insert(s + ' ') }, s));
  const tabs = [['out', 'Saída'], ['tests', 'Resultado'], ['sql', 'SQL gerado']];
  if (!free && level.raSolution) tabs.push(['sol', 'Solução']);
  const con = tabbed(tabs);
  con.pane('out').append(emptyNote('Execute para ver a relação resultante.'));
  con.pane('tests').append(emptyNote('Envie para comparar com o resultado esperado.'));
  con.pane('sql').append(emptyNote('O SQL equivalente aparece aqui após executar.'));
  if (con.pane('sol')) con.pane('sol').append(revealBlock('Mostrar uma solução', () => h('div', {}, h('pre', { class: 'code' }, level.raSolution), level.explain ? h('div', { class: 'prose-sm', html: level.explain }) : null)));

  async function run(grade) {
    const out = con.pane('out');
    out.innerHTML = ''; out.append(spinner('Executando no PostgreSQL…'));
    con.show(grade ? 'tests' : 'out');
    if (grade) { con.pane('tests').innerHTML = ''; con.pane('tests').append(spinner('Corrigindo…')); }
    try {
      const res = await serial(async () => {
        await resetTo(db);
        if (!catalogCache[schema]) catalogCache[schema] = await loadCatalog(query, schema);
        const tr = translate(ed.get(), catalogCache[schema], schema);
        con.pane('sql').innerHTML = '';
        con.pane('sql').append(h('pre', { class: 'code' }, tr.sql));
        const mine = await query(tr.sql);
        const expected = grade && level.solution ? await query(level.solution) : null;
        return { mine, expected };
      });
      out.innerHTML = '';
      out.append(resultTable(res.mine, 'Sua relação'));
      if (grade && res.expected) {
        const cmp = compareResults(res.mine, res.expected);
        const t = con.pane('tests');
        t.innerHTML = '';
        t.append(feedbackBox(cmp.ok, cmp.ok ? 'A expressão produz a relação esperada.' : 'A relação é diferente da esperada.', [{ status: cmp.ok ? 'ok' : 'err', text: cmp.ok ? `Mesmas tuplas (${res.expected.rows.length})` : cmp.msg }]));
        if (!cmp.ok) t.append(resultTable(res.expected, 'Relação esperada'));
        if (cmp.ok) onPass(3);
      }
    } catch (e) {
      const msg = e instanceof RAError ? 'Erro na expressão: ' + e.message : errMsg(e);
      out.innerHTML = ''; out.append(errBox(msg));
      if (grade) { con.pane('tests').innerHTML = ''; con.pane('tests').append(errBox(msg)); }
    }
  }
  foot.append(kbd('Ctrl', 'Enter'), h('span', { class: 'muted small' }, 'executa'), h('span', { class: 'grow' }),
    h('button', { class: 'btn secondary', onclick: () => run(false) }, 'Executar'),
    free ? null : h('button', { class: 'btn primary', onclick: () => run(true) }, 'Enviar'));
  root.append(foot);
  ed.onKey((e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(!free && e.shiftKey); } });
  return h('div', { class: 'workspace' }, root, con.el);
}

// ---------- SQL ----------
export function sqlWorkspace(level, onPass, { storeKey } = {}) {
  const key = storeKey || 'sql:' + level.id;
  const dbLabel = DB_INFO[level.db]?.schema || level.db;
  const { root, foot } = ideShell({
    title: 'PostgreSQL', meta: `PGlite (WebAssembly) · banco ${dbLabel}${level.mode === 'script' ? ' · script' : ''}`,
    extra: h('button', { class: 'btn ghost small', title: 'Voltar ao código inicial', onclick: () => { if (confirm('Apagar seu código e voltar ao inicial?')) ed.set(level.starter || ''); } }, 'Restaurar'),
  });
  const ed = codeEditor(root, { value: store.get(key, level.starter || ''), onChange: (v) => store.set(key, v), placeholder: '-- escreva seu SQL aqui' });
  const tabs = [['out', 'Saída'], ['tests', 'Resultado']];
  if (level.mode !== 'script') tabs.push(['exp', 'Esperado']);
  tabs.push(['sol', 'Solução']);
  const con = tabbed(tabs);
  con.pane('out').append(emptyNote('Execute o código para ver a saída. O banco é recriado a cada execução.'));
  con.pane('tests').append(emptyNote(level.mode === 'script'
    ? 'Ao enviar, o corretor roda seu script e faz verificações de estrutura, restrições e comportamento.'
    : 'Ao enviar, sua consulta é comparada com o resultado esperado (a ordem só conta se o enunciado pedir).'));
  if (con.pane('exp')) {
    const load = h('button', { class: 'btn secondary', onclick: async () => {
      const p = con.pane('exp'); p.innerHTML = ''; p.append(spinner());
      try { const r = await expectedResult(level); p.innerHTML = ''; p.append(resultTable(r, 'Resultado esperado')); } catch (e) { p.innerHTML = ''; p.append(errBox(errMsg(e))); }
    } }, 'Carregar resultado esperado');
    con.pane('exp').append(h('p', { class: 'muted' }, 'Veja a tabela que sua consulta deve produzir.'), load);
  }
  con.pane('sol').append(revealBlock('Mostrar solução de referência', () => h('div', {}, h('pre', { class: 'code' }, level.solution.trim()),
    level.explain ? h('div', { class: 'prose-sm', html: level.explain }) : null,
    h('div', { class: 'btnrow' }, h('button', { class: 'btn secondary', onclick: () => ed.set(level.solution.trim()) }, 'Copiar para o editor')))));

  async function exec() {
    const out = con.pane('out');
    con.show('out');
    out.innerHTML = ''; out.append(spinner('Executando…'));
    const r = await runForDisplay(level.db, level.setup, ed.get());
    out.innerHTML = '';
    if (r.error) out.append(errBox(r.error));
    else showResults(out, r.results);
  }
  async function verify() {
    const t = con.pane('tests');
    con.show('tests');
    t.innerHTML = ''; t.append(spinner('Corrigindo…'));
    const r = await gradeSQL(level, ed.get());
    t.innerHTML = '';
    t.append(feedbackBox(r.pass, r.pass ? 'Todas as verificações passaram.' : 'Algumas verificações falharam.', r.items));
    if (r.userResults) { const o = con.pane('out'); showResults(o, r.userResults); }
    if (!r.pass && r.expected) t.append(resultTable(r.expected, 'Resultado esperado'));
    if (r.pass) onPass(3);
  }
  foot.append(kbd('Ctrl', 'Enter'), h('span', { class: 'muted small' }, 'executa'), kbd('Ctrl', 'Shift', 'Enter'), h('span', { class: 'muted small' }, 'envia'), h('span', { class: 'grow' }),
    h('button', { class: 'btn secondary', onclick: exec }, 'Executar'),
    h('button', { class: 'btn primary', onclick: verify }, 'Enviar'));
  root.append(foot);
  ed.onKey((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (e.shiftKey) verify(); else exec(); }
  });
  return h('div', { class: 'workspace' }, root, con.el);
}

export function schemaBrowser(dbName) {
  const box = h('div', { class: 'schema-list' }, spinner('Lendo esquema…'));
  serial(async () => {
    await resetTo(dbName);
    const schema = DB_INFO[dbName].schema;
    return query(`SELECT table_name, string_agg(column_name || ' ' || data_type, ', ' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema='${schema}' GROUP BY table_name ORDER BY table_name`);
  }).then((r) => {
    box.innerHTML = '';
    if (!r.rows.length) box.append(emptyNote('Nenhuma tabela. Crie as suas com CREATE TABLE.'));
    for (const [t, cols] of r.rows) {
      box.append(h('details', {}, h('summary', {}, t), h('ul', {}, cols.split(', ').map((c) => h('li', {}, c)))));
    }
  }).catch((e) => { box.innerHTML = ''; box.append(errBox(errMsg(e))); });
  return box;
}

export { staticSVG, specToModel, runScript };
