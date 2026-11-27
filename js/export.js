// Exportar respostas: monta um relatório com tudo o que o aluno respondeu e imprime/salva em PDF.
import { h, store } from './util.js';
import { staticSVG, specToModel } from './er.js';
import { renderRA } from './algebra.js';
import { cleanGabarito } from './relational.js';
import { WORLDS } from './content/levels.js';
import { BOSSES } from './content/bosses.js';

const TYPE = { quiz: 'Questões', er: 'Modelo ER', map: 'Mapeamento', ra: 'Álgebra relacional', sql: 'SQL' };
const LETTER = 'ABCDE';

/** Resposta salva do aluno para um exercício (ou null se não respondeu). */
function answerOf(type, id, starter = '') {
  if (type === 'quiz') { const a = store.get('quiz:' + id); return a && Object.keys(a).length ? a : null; }
  if (type === 'er') { const m = store.get('er:' + id); return m && m.nodes && m.nodes.length ? m : null; }
  const t = store.get(type + ':' + id);
  return typeof t === 'string' && t.trim() && t.trim() !== String(starter).trim() ? t : null;
}

/** Todos os exercícios (trilha + avaliação final), na ordem do site. */
function allItems() {
  const prog = store.get('progress', {});
  const items = [];
  WORLDS.forEach((w, wi) => {
    const group = `Módulo ${wi + 1} — ${w.title.replace(/^Mundo [^—]+— /, '')}`;
    for (const l of w.levels) items.push({ group, boss: false, id: l.id, title: l.title, type: l.type, intro: l.intro, level: l, done: prog[l.id], answer: answerOf(l.type, l.id, l.starter) });
  });
  for (const b of BOSSES) {
    const group = `Avaliação final — Projeto ${b.n}: ${b.title}`;
    b.phases.forEach((p, i) => {
      const key = `${b.id}.p${i}`;
      if (p.kind === 'sqlset') {
        p.tasks.forEach((t, j) => {
          const id = `${key}.t${j}`;
          items.push({ group, boss: true, id, title: `${p.title} · Consulta ${j + 1}: ${t.title}`, type: 'sql', intro: t.task, level: t, done: prog[id], answer: answerOf('sql', id, t.starter) });
        });
      } else {
        items.push({ group, boss: true, id: key, title: p.title, type: p.kind, intro: p.intro, level: p, done: prog[key], answer: answerOf(p.kind, key, p.starter) });
      }
    });
  }
  return items;
}

const pre = (txt) => h('pre', { class: 'rep-code' }, txt);
function raBlock(src) {
  let paper = null;
  try { paper = h('div', { class: 'ra-paper', html: renderRA(src) }); } catch { /* expressão inválida: fica só o texto */ }
  return h('div', {}, paper, pre(src));
}

function renderAnswer(it) {
  const a = it.answer;
  switch (it.type) {
    case 'quiz': {
      const qs = it.level.questions || [];
      return h('ol', { class: 'rep-quiz' }, qs.map((q, qi) => {
        const mine = a[qi];
        const right = mine === q.a;
        return h('li', {},
          h('div', { class: 'rep-q', html: q.q }),
          h('div', { class: 'rep-a ' + (mine === undefined ? '' : right ? 'ok' : 'err') },
            mine === undefined ? 'Sem resposta' : h('span', {}, `Sua resposta: ${LETTER[mine]}) `, h('span', { html: q.opts[mine] }), right ? '  ✓' : '  ✗')));
      }));
    }
    case 'er': return h('div', { class: 'rep-svg', html: staticSVG(a, { maxWidth: 680 }) });
    case 'ra': return raBlock(a);
    default: return pre(a);
  }
}

function renderKey(it) {
  const l = it.level;
  try {
    switch (it.type) {
      case 'quiz': return h('ol', { class: 'rep-quiz' }, (l.questions || []).map((q) => h('li', {}, h('span', {}, `${LETTER[q.a]}) `), h('span', { html: q.opts[q.a] }))));
      case 'er': return l.gabarito ? h('div', { class: 'rep-svg', html: staticSVG(specToModel(l.gabarito), { maxWidth: 680 }) }) : null;
      case 'map': return l.gabarito ? pre(cleanGabarito(l.gabarito).trim()) : null;
      case 'ra': return l.raSolution ? raBlock(l.raSolution) : null;
      default: return l.solution ? pre(l.solution.trim()) : null;
    }
  } catch { return null; }
}

const stars = (d) => (d ? 'Concluído ' + '★'.repeat(d.stars || 1) + '☆'.repeat(3 - (d.stars || 1)) : 'Pendente');

export function pageExport(app) {
  app.className = 'app page export-page';
  const opt = store.get('exportOpts', { intro: true, key: false, empty: false, boss: true });
  const items = allItems();
  const answered = items.filter((i) => i.answer);

  const check = (k, label) => {
    const i = h('input', { type: 'checkbox', checked: !!opt[k] });
    i.onchange = () => { opt[k] = i.checked; store.set('exportOpts', opt); draw(); };
    return h('label', { class: 'check' }, i, h('span', {}, label));
  };
  const count = h('span', { class: 'small muted' });
  const report = h('article', { class: 'report' });

  function savePDF() {
    // imprime sempre no tema claro
    const root = document.documentElement;
    const prev = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'light');
    const restore = () => { if (prev === null) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', prev); window.removeEventListener('afterprint', restore); };
    window.addEventListener('afterprint', restore);
    const title = document.title;
    document.title = 'BD Quest - minhas respostas';
    window.print();
    document.title = title;
  }

  const controls = h('section', { class: 'panel export-controls no-print' },
    h('div', { class: 'export-opts' },
      check('intro', 'Incluir enunciados'),
      check('key', 'Incluir gabarito ao lado da resposta'),
      check('empty', 'Incluir exercícios sem resposta'),
      check('boss', 'Incluir avaliação final (projetos)')),
    h('div', { class: 'export-actions' }, count, h('span', { class: 'grow' }),
      h('button', { class: 'btn primary', onclick: savePDF }, 'Salvar como PDF')),
    h('p', { class: 'small muted' }, 'Na janela que abrir, escolha o destino ', h('b', {}, 'Salvar como PDF'), '. As respostas ficam salvas só neste navegador, então exporte deste mesmo computador.'));

  function draw() {
    const list = items.filter((i) => (opt.boss || !i.boss) && (opt.empty || i.answer));
    const n = list.filter((i) => i.answer).length;
    count.textContent = `${n} resposta${n === 1 ? '' : 's'} · ${list.length} exercício${list.length === 1 ? '' : 's'} no PDF`;
    report.innerHTML = '';
    const when = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    report.append(h('header', { class: 'rep-head' },
      h('div', { class: 'overline' }, 'BD Quest · Banco de Dados I (09913)'),
      h('h1', {}, 'Minhas respostas'),
      h('p', { class: 'muted small' }, `Gerado em ${when} · ${answered.length} de ${items.length} exercícios respondidos · ${items.filter((i) => i.done).length} concluídos`)));
    if (!list.length) {
      report.append(h('p', { class: 'muted' }, 'Você ainda não respondeu nenhum exercício. As respostas aparecem aqui assim que você escreve algo em um desafio.'));
      return;
    }
    let group = null;
    for (const it of list) {
      if (it.group !== group) { group = it.group; report.append(h('h2', { class: 'rep-group' }, group)); }
      const key = opt.key ? renderKey(it) : null;
      report.append(h('section', { class: 'rep-item' },
        h('div', { class: 'rep-title' },
          h('span', { class: 'rep-id' }, it.id), h('span', { class: 'rep-name' }, it.title),
          h('span', { class: 'rep-meta' }, `${TYPE[it.type] || it.type} · ${stars(it.done)}`)),
        opt.intro && it.intro ? h('div', { class: 'rep-intro', html: it.intro }) : null,
        h('div', { class: 'rep-label' }, 'Minha resposta'),
        it.answer ? renderAnswer(it) : h('p', { class: 'muted small' }, 'Sem resposta.'),
        key ? h('div', { class: 'rep-label' }, 'Gabarito') : null, key));
    }
  }
  draw();
  app.append(
    h('header', { class: 'page-head no-print' }, h('div', {}, h('div', { class: 'overline' }, 'Exportar'), h('h1', {}, 'Exportar respostas em PDF'),
      h('p', { class: 'page-meta' }, 'Junta tudo o que você respondeu nos desafios e na avaliação final: SQL, álgebra, mapeamento, diagramas ER e questões.'))),
    controls, report);
}
