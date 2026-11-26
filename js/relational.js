// Notação resumida do esquema relacional (Heuser), como usada em aula:
//
//   EMPREGADO (#matricula, nome, salario, sigla)
//     sigla referencia DEPARTAMENTO
//   TRABALHA (#matricula, #codProj, horas)
//     matricula referencia EMPREGADO
//     codProj referencia PROJETO
//     (a, b) referencia OUTRA
//     cpf é chave candidata
//     telefone é opcional
//
// "#" marca atributo da chave primária (no papel: sublinhado).
// No gabarito, sinônimos aceitos: TABELA|SINONIMO e atributo|sinonimo.

import { norm, nameMatch, esc, bestMatch } from './util.js';

function splitTop(s) {
  const out = []; let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

export function parseSchema(text) {
  const tables = [];
  const errors = [];
  let cur = null;
  const lines = text.replace(/\r/g, '').split('\n');
  // junta linhas de uma mesma definição de tabela (parênteses abertos)
  const joined = [];
  let buf = '', depth = 0;
  for (const raw of lines) {
    const line = raw.replace(/(\/\/|--).*$/, '');
    if (!buf && !line.trim()) continue;
    buf += (buf ? ' ' : '') + line.trim();
    for (const ch of line) { if (ch === '(') depth++; if (ch === ')') depth--; }
    if (depth <= 0) { joined.push(buf); buf = ''; depth = 0; }
  }
  if (buf) { joined.push(buf); errors.push('Parêntese não fechado em: ' + buf.slice(0, 40)); }

  for (let line of joined) {
    line = line.replace(/[;.]\s*$/, '').trim();
    if (!line) continue;
    const mT = /^([\p{L}_][\p{L}\p{N}_\-|]*)\s*\((.*)\)\s*,?$/u.exec(line);
    // FK:  x referencia T  |  (a,b) referencia T  |  x -> T  | x references T
    const mF = /^(\(.*?\)|[\p{L}_#][\p{L}\p{N}_#]*)\s*(?:referencia|referência|references|ref\.?|->|→)\s*([\p{L}_][\p{L}\p{N}_|]*)(.*)$/iu.exec(line);
    if (mF && !mT) {
      if (!cur) { errors.push('FK antes de qualquer tabela: ' + line); continue; }
      const cols = mF[1].replace(/[()#]/g, '').split(',').map((s) => s.trim()).filter(Boolean);
      const rest = mF[3] || '';
      cur.fks.push({ cols, ref: mF[2], optional: /opcional|nulo|null/i.test(rest), line });
      continue;
    }
    const mC = /^(\(.*?\)|[\p{L}_][\p{L}\p{N}_]*)\s*(?:é|e)?\s*chave\s+candidata|^(\(.*?\)|[\p{L}_][\p{L}\p{N}_]*)\s+(?:unique|único|unico)/iu.exec(line);
    if (mC && !mT) {
      if (cur) cur.cks.push((mC[1] || mC[2]).replace(/[()]/g, '').split(',').map((s) => s.trim()));
      continue;
    }
    if (!mT && /(opcional|admite\s+nul|pode\s+ser\s+nul|dom\s*\(|não\s+nul|nao\s+nul)/i.test(line)) {
      if (cur) cur.notes.push(line);
      continue;
    }
    if (mT) {
      const names = mT[1].split('|');
      cur = { name: names[0], aliases: names, attrs: [], pk: [], fks: [], cks: [], notes: [] };
      for (let a of splitTop(mT[2])) {
        let isPk = false;
        a = a.trim();
        if (a.startsWith('#') || a.startsWith('*')) { isPk = true; a = a.slice(1); }
        if (/^_.*_$/.test(a)) { isPk = true; a = a.slice(1, -1); }
        if (/\b(pk)\b/i.test(a)) { isPk = true; a = a.replace(/\(?\bpk\b\)?/i, ''); }
        // FK inline: atributo -> TABELA
        let inlineRef = null;
        const mi = /^(.*?)\s*(?:->|→)\s*([\p{L}_][\p{L}\p{N}_]*)$/u.exec(a);
        if (mi) { a = mi[1]; inlineRef = mi[2]; }
        const anames = a.trim().split('|').map((s) => s.trim()).filter(Boolean);
        if (!anames.length) continue;
        cur.attrs.push({ name: anames[0], aliases: anames });
        if (isPk) cur.pk.push(anames[0]);
        if (inlineRef) cur.fks.push({ cols: [anames[0]], ref: inlineRef, line: a });
      }
      tables.push(cur);
      continue;
    }
    errors.push('Não entendi a linha: ' + line);
  }
  return { tables, errors };
}

/** Pré-visualização em HTML do esquema. */
export function renderSchema(parsed) {
  const div = document.createElement('div');
  div.className = 'rel-preview';
  for (const t of parsed.tables) {
    const fkOf = (a) => t.fks.find((f) => f.cols.some((c) => norm(c) === norm(a)));
    const lis = t.attrs.map((a) => {
      const fk = fkOf(a.name);
      const pk = t.pk.includes(a.name);
      return `<li class="${pk ? 'pk' : ''}">${pk ? '🔑' : '<span style="width:1.1em;display:inline-block"></span>'}<span class="n">${esc(a.name)}</span>${fk ? `<span class="fk">→ ${esc(fk.ref)}</span>` : ''}</li>`;
    }).join('');
    const notes = [
      ...t.cks.map((c) => `${c.join(', ')} é chave candidata`),
      ...t.fks.filter((f) => f.cols.length > 1).map((f) => `(${f.cols.join(', ')}) → ${f.ref}`),
      ...t.notes,
    ];
    div.insertAdjacentHTML('beforeend', `<div class="rtable"><div class="rname">${esc(t.name)}</div><ul>${lis}</ul>${notes.length ? `<div class="notes">${notes.map(esc).join('<br>')}</div>` : ''}</div>`);
  }
  if (!parsed.tables.length) div.innerHTML = '<p class="muted small">A pré-visualização aparece aqui conforme você digita.</p>';
  return div;
}

/** Texto do gabarito sem os sinônimos (para exibição). */
export function cleanGabarito(text) {
  return text.replace(/\|[\p{L}\p{N}_|]+/gu, '');
}

const attrMatch = (userName, exp) => exp.aliases.some((al) => nameMatch(userName, al));
const tableMatch = (userT, expT) => expT.aliases.some((al) => nameMatch(userT.name, al));

/** Compara o esquema do aluno com o gabarito. */
export function checkSchema(userText, gabaritoText) {
  const U = parseSchema(userText);
  const G = parseSchema(gabaritoText);
  const items = [];
  let errs = 0;
  const err = (text, why) => { errs++; items.push({ status: 'err', text, why }); };
  const ok = (text) => items.push({ status: 'ok', text });
  const warn = (text, why) => items.push({ status: 'warn', text, why });

  for (const e of U.errors) err(esc(e));
  if (!U.tables.length) return { pass: false, items: [{ status: 'err', text: 'Nenhuma tabela reconhecida. Use o formato <code>TABELA (#chave, atributo, ...)</code>.' }] };

  // 1) casamento de tabelas: por nome; depois por semelhança de atributos
  const map = new Map(); // gab -> user
  const used = new Set();
  const exactFirst = [...G.tables].sort((a, b) => Number(!U.tables.some((t) => a.aliases.some((al) => norm(al) === norm(t.name))))
    - Number(!U.tables.some((t) => b.aliases.some((al) => norm(al) === norm(t.name)))));
  for (const g of exactFirst) {
    const u = bestMatch(U.tables, g.aliases, (t) => t.name, used);
    if (u) { map.set(g, u); used.add(u); }
  }
  for (const g of G.tables) {
    if (map.has(g)) continue;
    let best = null, bestScore = 0;
    for (const u of U.tables) {
      if (used.has(u)) continue;
      const hits = g.attrs.filter((ga) => u.attrs.some((ua) => attrMatch(ua.name, ga))).length;
      const score = hits / Math.max(g.attrs.length, u.attrs.length);
      if (score > bestScore) { best = u; bestScore = score; }
    }
    if (best && bestScore >= 0.6) { map.set(g, best); used.add(best); }
  }
  const userOf = (gName) => { const g = G.tables.find((t) => t.aliases.some((a) => norm(a) === norm(gName))); return g ? map.get(g) : null; };

  for (const g of G.tables) {
    const u = map.get(g);
    if (!u) { err(`Faltou a tabela <b>${esc(g.name)}</b> (atributos esperados: ${g.attrs.map((a) => esc(a.name)).join(', ')}).`, g.hint || ''); continue; }
    const label = u.name === g.name ? `<b>${esc(u.name)}</b>` : `<b>${esc(u.name)}</b> (≈ ${esc(g.name)})`;
    // atributos
    const missing = g.attrs.filter((ga) => !u.attrs.some((ua) => attrMatch(ua.name, ga)));
    // PK
    const pkExp = g.pk.map((p) => g.attrs.find((a) => a.name === p));
    const pkOk = u.pk.length === pkExp.length && pkExp.every((ga) => u.pk.some((p) => attrMatch(p, ga)));
    if (!pkOk) {
      err(`${label}: chave primária deveria ser (${g.pk.map(esc).join(', ')}); você marcou (${u.pk.map(esc).join(', ') || 'nenhuma'}).`,
        pkExp.length > 1 ? 'Chave composta: marque cada parte com #.' : 'Marque a chave primária com # na frente do atributo.');
    }
    if (missing.length) err(`${label}: faltam atributos ${missing.map((m) => '<code>' + esc(m.name) + '</code>').join(', ')}.`);
    const extra = u.attrs.filter((ua) => !g.attrs.some((ga) => attrMatch(ua.name, ga)));
    if (extra.length && !missing.length) warn(`${label}: atributos a mais ${extra.map((m) => '<code>' + esc(m.name) + '</code>').join(', ')} — confira se não é redundância.`);
    // FKs
    for (const gf of g.fks) {
      const target = userOf(gf.ref);
      const found = u.fks.find((uf) => uf.cols.length === gf.cols.length && (
        (target && nameMatch(uf.ref, target.name)) || G.tables.find((t) => t.aliases.some((a) => norm(a) === norm(gf.ref)))?.aliases.some((al) => nameMatch(uf.ref, al))));
      if (!found) err(`${label}: falta a chave estrangeira (${gf.cols.map(esc).join(', ')}) referencia <b>${esc(gf.ref)}</b>.`, 'Escreva numa linha abaixo da tabela: <code>atributo referencia TABELA</code>.');
    }
    const extraFk = u.fks.filter((uf) => !g.fks.some((gf) => {
      const target = userOf(gf.ref);
      return (target && nameMatch(uf.ref, target.name)) || nameMatch(uf.ref, gf.ref);
    }));
    for (const xf of extraFk) warn(`${label}: FK para <b>${esc(xf.ref)}</b> não está no gabarito.`);
    if (pkOk && !missing.length && g.fks.every((gf) => u.fks.some((uf) => nameMatch(uf.ref, userOf(gf.ref)?.name || gf.ref)))) ok(`${label} correta.`);
  }
  for (const u of U.tables) {
    if (![...map.values()].includes(u)) warn(`Tabela <b>${esc(u.name)}</b> não corresponde a nenhuma do gabarito.`, 'Pode ser um relacionamento que deveria ter sido absorvido (1:n / 1:1) ou uma tabela extra.');
  }
  return { pass: errs === 0, items };
}
