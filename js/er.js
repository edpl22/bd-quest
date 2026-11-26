// Editor de diagramas ER no estilo brModelo (notação de Peter Chen / Heuser).
// - Entidade: retângulo (fraca: retângulo duplo)
// - Relacionamento: losango (entidade associativa: losango dentro de retângulo)
// - Atributo: "pirulito" (○ comum, ● identificador), cardinalidade ao lado se multivalorado/opcional
// - Especialização: triângulo com (t,e) (p,e) (t,i) (p,i)
// - Cardinalidade (mín,máx) escrita junto à entidade, lida a partir da OUTRA entidade (Heuser).

import { h, esc, toast, download, nameMatch, norm, bestMatch } from './util.js';

const ENT_H = 46, REL_H = 60, ATTR_R = 5;
let measureCtx = null;
function tw(text, font = '600 13px Inter, sans-serif') {
  if (typeof document === 'undefined') return String(text || '').length * 7.5;
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  measureCtx.font = font;
  return measureCtx.measureText(text || '').width;
}
export function nodeSize(n) {
  if (n.type === 'entity') return { w: Math.max(100, tw(n.name) + 30), h: ENT_H };
  if (n.type === 'rel') return { w: Math.max(110, tw(n.name) + 56), h: REL_H };
  return { w: 0, h: 0 };
}

export function emptyModel() { return { nodes: [], links: [], seq: 1 }; }
const uid = (m) => 'n' + (m.seq++);
const byId = (m, id) => m.nodes.find((n) => n.id === id);

// ---------- geometria ----------
function boundary(m, n, tx, ty) {
  const dx = tx - n.x, dy = ty - n.y;
  if (n.type === 'attr') {
    const d = Math.hypot(dx, dy) || 1;
    return { x: n.x + dx / d * ATTR_R, y: n.y + dy / d * ATTR_R };
  }
  if (n.type === 'spec') return { x: n.x, y: n.y + 10 };
  const { w, h: hh } = nodeSize(n);
  if (!dx && !dy) return { x: n.x, y: n.y };
  if (n.type === 'rel' && !n.assoc) {
    const t = 1 / (Math.abs(dx) / (w / 2) + Math.abs(dy) / (hh / 2));
    return { x: n.x + dx * t, y: n.y + dy * t };
  }
  const W = n.type === 'rel' ? w / 2 + 8 : w / 2, H = n.type === 'rel' ? hh / 2 + 6 : hh / 2;
  const t = Math.min(W / Math.abs(dx || 1e-9), H / Math.abs(dy || 1e-9));
  return { x: n.x + dx * t, y: n.y + dy * t };
}

function descendants(m, id) {
  const out = [];
  const walk = (pid) => m.nodes.filter((n) => n.owner === pid && n.type === 'attr').forEach((a) => { out.push(a); walk(a.id); });
  walk(id);
  return out;
}

function placeAttr(m, owner) {
  const sibs = m.nodes.filter((n) => n.type === 'attr' && n.owner === owner.id);
  const blocked = neighborAngles(m, owner);
  const used = sibs.map((s) => Math.atan2(s.y - owner.y, s.x - owner.x));
  const cands = [];
  for (let k = 0; k < 24; k++) cands.push(-Math.PI / 2 + k * Math.PI / 12);
  let best = cands[0], bestScore = -1;
  for (const a of cands) {
    const dist = (b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
    const s = Math.min(...[...blocked, ...used].map(dist), Math.PI);
    if (s > bestScore + 1e-6) { bestScore = s; best = a; }
  }
  return attrPos(owner, best);
}
function attrPos(owner, ang) {
  const far = { x: owner.x + Math.cos(ang) * 500, y: owner.y + Math.sin(ang) * 500 };
  const b = owner.type === 'attr' ? { x: owner.x, y: owner.y } : boundary(null, owner, far.x, far.y);
  const extra = (owner.type === 'attr' ? 42 : 30) + 18 * Math.abs(Math.sin(2 * ang));
  return { x: Math.round(b.x + Math.cos(ang) * extra), y: Math.round(b.y + Math.sin(ang) * extra) };
}
function neighborAngles(m, n) {
  const angs = [];
  for (const l of m.links) {
    let o = null;
    if (l.to === n.id) o = byId(m, l.from); else if (l.from === n.id) o = byId(m, l.to);
    if (o) angs.push(Math.atan2(o.y - n.y, o.x - n.x));
  }
  if (n.type === 'attr' && n.owner) { const o = byId(m, n.owner); if (o) angs.push(Math.atan2(o.y - n.y, o.x - n.x)); }
  for (const s of m.nodes.filter((x) => x.type === 'spec' && x.owner === n.id)) angs.push(Math.atan2(s.y - n.y, s.x - n.x));
  if (n.type === 'entity') {
    for (const l of m.links) {
      const sp = byId(m, l.from);
      if (sp && sp.type === 'spec' && l.to === n.id) angs.push(Math.atan2(sp.y - n.y, sp.x - n.x));
    }
  }
  return angs;
}

// ---------- validação sintática ----------
export function toSemantic(m) {
  const ents = m.nodes.filter((n) => n.type === 'entity' || (n.type === 'rel' && n.assoc));
  const attrsOf = (id) => m.nodes.filter((a) => a.type === 'attr' && a.owner === id).map((a) => ({
    name: a.name, key: !!a.key, card: a.card || '', children: attrsOf(a.id),
  }));
  const specs = m.nodes.filter((n) => n.type === 'spec').map((s) => ({
    id: s.id, parent: byId(m, s.owner)?.name, kind: s.kind,
    children: m.links.filter((l) => l.from === s.id).map((l) => byId(m, l.to)?.name).filter(Boolean),
  }));
  return {
    entities: m.nodes.filter((n) => n.type === 'entity').map((e) => ({ id: e.id, name: e.name, weak: !!e.weak, attrs: attrsOf(e.id) })),
    rels: m.nodes.filter((n) => n.type === 'rel').map((r) => ({
      id: r.id, name: r.name, assoc: !!r.assoc, attrs: attrsOf(r.id),
      ends: m.links.filter((l) => l.from === r.id).map((l) => ({ ent: byId(m, l.to)?.name, card: l.card || '', role: l.role || '' })),
    })),
    specs,
    _ents: ents,
  };
}

export function validateModel(m) {
  const S = toSemantic(m);
  const issues = [];
  const childNames = new Set(S.specs.flatMap((s) => s.children.map(norm)));
  const names = {};
  for (const e of S.entities) {
    const k = norm(e.name);
    if (names[k]) issues.push({ status: 'err', text: `Duas entidades com o nome <b>${esc(e.name)}</b>.` });
    names[k] = 1;
    if (!childNames.has(k) && !e.attrs.some((a) => a.key)) {
      issues.push({ status: 'err', text: `Entidade <b>${esc(e.name)}</b> sem atributo identificador.`, why: 'Erro sintático: no ER, toda entidade tem (ou herda, se for especialização) um identificador. Clique no atributo e marque "identificador".' });
    }
    const linked = m.links.some((l) => l.to === e.id || l.from === e.id) || m.nodes.some((n) => n.type === 'spec' && n.owner === e.id);
    if (!linked && S.entities.length > 1) issues.push({ status: 'warn', text: `Entidade <b>${esc(e.name)}</b> está isolada.`, why: 'Será que falta algum relacionamento?' });
  }
  for (const r of S.rels) {
    if (r.ends.length < 2) issues.push({ status: 'err', text: `Relacionamento <b>${esc(r.name)}</b> tem ${r.ends.length} ligação(ões); precisa de pelo menos 2.`, why: 'Use a ferramenta "Ligar" e clique no relacionamento e depois na entidade. Para auto-relacionamento, ligue duas vezes à mesma entidade.' });
    for (const en of r.ends) if (!parseCard(en.card)) issues.push({ status: 'err', text: `Cardinalidade inválida em <b>${esc(r.name)}</b>–${esc(en.ent)}: "${esc(en.card)}".` });
    const self = r.ends.length === 2 && norm(r.ends[0].ent) === norm(r.ends[1].ent);
    if (self && (!r.ends[0].role || !r.ends[1].role)) issues.push({ status: 'warn', text: `Auto-relacionamento <b>${esc(r.name)}</b>: dê nome aos papéis (ex.: chefe / subordinado).` });
  }
  for (const s of S.specs) {
    if (!s.children.length) issues.push({ status: 'err', text: `Especialização de <b>${esc(s.parent)}</b> sem entidades filhas.`, why: 'Use "Ligar": clique no triângulo e depois na entidade especializada.' });
  }
  for (const a of m.nodes.filter((n) => n.type === 'attr')) if (!a.name.trim()) issues.push({ status: 'err', text: 'Há um atributo sem nome.' });
  return issues;
}

export function parseCard(c) {
  const s = String(c || '').replace(/\s/g, '').toLowerCase();
  const m = /^\(?([0-9]+),([0-9]+|n|m|\*|p)\)?$/.exec(s);
  if (!m) return null;
  const max = /[nm*p]/.test(m[2]) ? 'n' : m[2];
  return { min: m[1], max, str: `(${m[1]},${max})` };
}

// ---------- leitura da cardinalidade (Heuser) ----------
export function readingFor(m, link) {
  const rel = byId(m, link.from), ent = byId(m, link.to);
  if (!rel || !ent) return '';
  const c = parseCard(link.card);
  if (!c) return 'Cardinalidade inválida. Use (mín,máx), ex.: (0,n).';
  if (rel.type === 'spec') return '';
  const others = m.links.filter((l) => l.from === rel.id && l.id !== link.id).map((l) => ({ ent: byId(m, l.to), role: l.role }));
  const qty = (x) => x === 'n' ? 'muitos(as)' : x;
  const minTxt = c.min === '0' ? 'nenhum(a) (opcional)' : c.min;
  const em = (s) => `<b>${esc(s)}</b>`;
  if (others.length === 1) {
    const o = others[0];
    const oName = o.ent ? o.ent.name + (o.role ? ` (como ${o.role})` : '') : '?';
    const eName = ent.name + (link.role ? ` (como ${link.role})` : '');
    return `Leitura: <i>um(a)</i> ${em(oName)} ${esc(rel.name)} no mínimo ${minTxt} e no máximo ${qty(c.max)} ${em(eName)}.`;
  }
  if (others.length >= 2) {
    return `Leitura (n-ário): para cada combinação (${others.map((o) => em(o.ent?.name || '?')).join(', ')}), existem no mínimo ${minTxt} e no máximo ${qty(c.max)} ${em(ent.name)}.`;
  }
  return 'Ligue o relacionamento a outra entidade para ler a cardinalidade.';
}

// ---------- renderização ----------
const ST = {
  shape: 'fill:var(--er-fill);stroke:var(--er-ink);stroke-width:1.5',
  line: 'stroke:var(--er-ink);stroke-width:1.3;fill:none',
  text: 'fill:var(--er-ink)',
};

function renderSVG(m, sel, opts = {}) {
  const parts = [];
  const isSel = (id) => sel && sel.id === id;
  // linhas de atributos (desenhadas primeiro)
  for (const a of m.nodes.filter((n) => n.type === 'attr')) {
    const o = byId(m, a.owner);
    if (!o) continue;
    const p = boundary(m, o, a.x, a.y);
    parts.push(`<line x1="${p.x}" y1="${p.y}" x2="${a.x}" y2="${a.y}" style="${ST.line}"/>`);
  }
  // ligações
  for (const l of m.links) {
    const A = byId(m, l.from), B = byId(m, l.to);
    if (!A || !B) continue;
    if (A.type === 'spec') {
      const p2 = boundary(m, B, A.x, A.y + 10);
      parts.push(`<g class="link ${isSel(l.id) ? 'sel' : ''}" data-link="${l.id}"><line class="link-hit" style="stroke:transparent;stroke-width:12;fill:none" x1="${A.x}" y1="${A.y + 10}" x2="${p2.x}" y2="${p2.y}"/><line x1="${A.x}" y1="${A.y + 10}" x2="${p2.x}" y2="${p2.y}" style="${ST.line}${isSel(l.id) ? ';stroke:var(--er-sel);stroke-width:2.5' : ''}"/></g>`);
      continue;
    }
    // auto-relacionamento: duas linhas entre os mesmos nós -> curvar
    const twins = m.links.filter((x) => x.from === l.from && x.to === l.to);
    const k = twins.indexOf(l);
    const bend = twins.length > 1 ? (k === 0 ? -1 : 1) * 26 : 0;
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
    const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d, ny = dx / d;
    const cx = mx + nx * bend * 2, cy = my + ny * bend * 2;
    const pA = boundary(m, A, bend ? cx : B.x, bend ? cy : B.y);
    const pB = boundary(m, B, bend ? cx : A.x, bend ? cy : A.y);
    const path = bend ? `M${pA.x},${pA.y} Q${cx},${cy} ${pB.x},${pB.y}` : `M${pA.x},${pA.y} L${pB.x},${pB.y}`;
    // posição do rótulo: perto da entidade (B)
    const tx = bend ? cx : A.x, ty = bend ? cy : A.y;
    const ux = tx - pB.x, uy = ty - pB.y, ud = Math.hypot(ux, uy) || 1;
    const lx = pB.x + ux / ud * 22 + (-uy / ud) * 12, ly = pB.y + uy / ud * 22 + (ux / ud) * 12;
    const label = (l.card || '') + (l.role ? ' ' + l.role : '');
    const selSt = isSel(l.id) ? ';stroke:var(--er-sel);stroke-width:2.5' : '';
    parts.push(`<g class="link ${isSel(l.id) ? 'sel' : ''}" data-link="${l.id}"><path class="link-hit" style="stroke:transparent;stroke-width:12;fill:none" d="${path}"/><path d="${path}" style="${ST.line}${l.ident ? ';stroke-width:3.2' : ''}${selSt}"/><text x="${lx}" y="${ly + 4}" text-anchor="middle" style="${ST.text};font:600 12px var(--mono, monospace)">${esc(label)}</text></g>`);
  }
  // linha pendente
  if (opts.pending) {
    const A = byId(m, opts.pending.from);
    if (A) parts.push(`<line x1="${A.x}" y1="${A.y}" x2="${opts.pending.x}" y2="${opts.pending.y}" style="stroke:var(--er-sel);stroke-dasharray:5 4;stroke-width:1.5"/>`);
  }
  // especializações
  for (const s of m.nodes.filter((n) => n.type === 'spec')) {
    const P = byId(m, s.owner);
    if (P) {
      const p = boundary(m, P, s.x, s.y - 14);
      parts.push(`<line x1="${p.x}" y1="${p.y}" x2="${s.x}" y2="${s.y - 14}" style="${ST.line}"/>`);
    }
    const sel = isSel(s.id) ? ';stroke:var(--er-sel);stroke-width:2.5' : '';
    parts.push(`<g class="node" data-id="${s.id}"><polygon points="${s.x},${s.y - 14} ${s.x - 18},${s.y + 10} ${s.x + 18},${s.y + 10}" style="${ST.shape}${sel}"/><text x="${s.x + 24}" y="${s.y + 4}" style="${ST.text};font:600 12px var(--mono, monospace)">(${esc(s.kind || 't,e')})</text></g>`);
  }
  // entidades e relacionamentos
  for (const n of m.nodes.filter((x) => x.type === 'entity' || x.type === 'rel')) {
    const { w, h: hh } = nodeSize(n);
    const sel = isSel(n.id) ? ';stroke:var(--er-sel);stroke-width:2.5' : '';
    let shape = '';
    if (n.type === 'entity') {
      shape = `<rect x="${n.x - w / 2}" y="${n.y - hh / 2}" width="${w}" height="${hh}" rx="2" style="${ST.shape}${sel}"/>`;
      if (n.weak) shape += `<rect x="${n.x - w / 2 + 4}" y="${n.y - hh / 2 + 4}" width="${w - 8}" height="${hh - 8}" style="${ST.shape}${sel}"/>`;
    } else {
      if (n.assoc) shape += `<rect x="${n.x - w / 2 - 8}" y="${n.y - hh / 2 - 6}" width="${w + 16}" height="${hh + 12}" style="${ST.shape}${sel}"/>`;
      shape += `<polygon points="${n.x},${n.y - hh / 2} ${n.x + w / 2},${n.y} ${n.x},${n.y + hh / 2} ${n.x - w / 2},${n.y}" style="${ST.shape}${sel}"/>`;
    }
    parts.push(`<g class="node" data-id="${n.id}">${shape}<text x="${n.x}" y="${n.y + 4.5}" text-anchor="middle" style="${ST.text};font:600 13px Inter, sans-serif">${esc(n.name)}</text></g>`);
  }
  // atributos
  for (const a of m.nodes.filter((n) => n.type === 'attr')) {
    const o = byId(m, a.owner);
    const hasKids = m.nodes.some((x) => x.owner === a.id);
    const right = !o || a.x >= o.x - 2;
    const sel = isSel(a.id) ? ';stroke:var(--er-sel);stroke-width:2.5' : '';
    const fill = a.key ? 'var(--er-ink)' : 'var(--er-fill)';
    const dot = hasKids
      ? `<ellipse cx="${a.x}" cy="${a.y}" rx="9" ry="6" style="fill:${fill};stroke:var(--er-ink);stroke-width:1.4${sel}"/>`
      : `<circle cx="${a.x}" cy="${a.y}" r="${ATTR_R}" style="fill:${fill};stroke:var(--er-ink);stroke-width:1.4${sel}"/>`;
    const label = a.name + (a.card && a.card !== '(1,1)' ? ' ' + a.card : '');
    const off = hasKids ? 13 : 9;
    const tx = right ? a.x + off : a.x - off;
    parts.push(`<g class="node" data-id="${a.id}"><circle cx="${a.x}" cy="${a.y}" r="11" style="fill:transparent"/>${dot}<text x="${tx}" y="${a.y + 4}" text-anchor="${right ? 'start' : 'end'}" style="${ST.text};font:${a.key ? 600 : 400} 12px Inter, sans-serif${a.key ? ';text-decoration:underline' : ''}">${esc(label)}</text></g>`);
  }
  return parts.join('');
}

function bbox(m) {
  if (!m.nodes.length) return { x: 0, y: 0, w: 800, h: 500 };
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const n of m.nodes) {
    const { w, h: hh } = nodeSize(n);
    const extra = n.type === 'attr' ? 8 + tw(n.name, '12px Inter') : 0;
    x0 = Math.min(x0, n.x - w / 2 - extra); x1 = Math.max(x1, n.x + w / 2 + extra);
    y0 = Math.min(y0, n.y - hh / 2 - 12); y1 = Math.max(y1, n.y + hh / 2 + 12);
  }
  return { x: x0 - 30, y: y0 - 30, w: x1 - x0 + 60, h: y1 - y0 + 60 };
}

/** SVG estático (para teoria, gabaritos). */
export function staticSVG(m, { maxWidth = 900 } = {}) {
  const b = bbox(m);
  return `<svg viewBox="${b.x} ${b.y} ${b.w} ${b.h}" width="${Math.min(maxWidth, b.w)}" class="er-static" xmlns="http://www.w3.org/2000/svg">${renderSVG(m, null)}</svg>`;
}

// ---------- gabarito (especificação) -> modelo ----------
// attrs: '#cpf' (identificador), 'telefone(0,n)' (multivalorado), 'endereco{rua,numero}' (composto), 'nome|apelido' (sinônimo)
export function parseAttrSpec(s) {
  let str = s.trim();
  const key = str.startsWith('#');
  if (key) str = str.slice(1);
  let children = [];
  const mc = /^(.*?)\{(.*)\}(.*)$/.exec(str);
  if (mc) { children = splitAttrs(mc[2]).map(parseAttrSpec); str = mc[1] + mc[3]; }
  let card = '';
  const mk = /^(.*?)\s*(\(\s*\d+\s*,\s*(?:\d+|n|N)\s*\))\s*$/.exec(str);
  if (mk) { str = mk[1]; card = mk[2].replace(/\s/g, '').replace('N', 'n'); }
  const aliases = str.split('|').map((x) => x.trim()).filter(Boolean);
  return { name: aliases[0], aliases, key, card, children };
}
function splitAttrs(s) {
  const out = []; let d = 0, cur = '';
  for (const ch of s) { if (ch === '{') d++; if (ch === '}') d--; if (ch === ',' && !d) { out.push(cur); cur = ''; } else cur += ch; }
  if (cur.trim()) out.push(cur);
  return out;
}

export function specToModel(spec) {
  const m = emptyModel();
  const GX = 250, GY = 170, OX = 140, OY = 100;
  const pos = (at) => ({ x: OX + at[0] * GX, y: OY + at[1] * GY });
  const ids = {};
  for (const e of spec.entities || []) {
    const n = { id: uid(m), type: 'entity', name: e.name.split('|')[0], weak: !!e.weak, ...pos(e.at || [0, 0]) };
    m.nodes.push(n); ids[norm(n.name)] = n.id;
  }
  for (const r of spec.rels || []) {
    const n = { id: uid(m), type: 'rel', name: r.name.split('|')[0], assoc: !!r.assoc, ...pos(r.at || [0, 0]) };
    m.nodes.push(n); ids[norm(n.name)] = n.id;
  }
  for (const r of spec.rels || []) {
    const rid = ids[norm(r.name.split('|')[0])];
    for (const [ent, card, role] of r.links || []) {
      const to = ids[norm(ent.split('|')[0])];
      if (to) m.links.push({ id: uid(m), from: rid, to, card, role: role || '' });
    }
  }
  for (const s of spec.specs || []) {
    const parent = byId(m, ids[norm(s.parent)]);
    const kids = s.children.map((c) => byId(m, ids[norm(c)])).filter(Boolean);
    const x = kids.length ? kids.reduce((a, k) => a + k.x, 0) / kids.length : parent.x;
    const sp = { id: uid(m), type: 'spec', owner: parent.id, kind: s.kind || 't,e', x: Math.round(x), y: Math.round((parent.y + (kids[0]?.y ?? parent.y + 150)) / 2) };
    m.nodes.push(sp);
    for (const k of kids) m.links.push({ id: uid(m), from: sp.id, to: k.id, card: '' });
  }
  const addAttrs = (ownerId, list) => {
    for (const a of list || []) {
      const p = parseAttrSpec(a);
      const owner = byId(m, ownerId);
      const n = { id: uid(m), type: 'attr', owner: ownerId, name: p.name, key: p.key, card: p.card, ...placeAttr(m, owner) };
      m.nodes.push(n);
      if (p.children.length) addAttrs(n.id, p.children.map((c) => (c.key ? '#' : '') + c.aliases.join('|') + (c.card || '')));
    }
  };
  for (const e of spec.entities || []) addAttrs(ids[norm(e.name.split('|')[0])], e.attrs);
  for (const r of spec.rels || []) addAttrs(ids[norm(r.name.split('|')[0])], r.attrs);
  return m;
}

// ---------- correção ----------
function attrFind(list, exp) {
  return bestMatch(list, exp.aliases);
}

export function checkModel(m, spec) {
  const S = toSemantic(m);
  const items = [];
  let errs = 0;
  const err = (text, why) => { errs++; items.push({ status: 'err', text, why }); };
  const warn = (text, why) => items.push({ status: 'warn', text, why });
  const ok = (text) => items.push({ status: 'ok', text });

  for (const v of validateModel(m)) { if (v.status === 'err') errs++; items.push(v); }

  const entMap = {}; // norm(expected) -> user entity
  const allUserEnts = [...S.entities, ...S.rels.filter((r) => r.assoc).map((r) => ({ ...r, weak: false }))];
  const expEnts = [...(spec.entities || []).map((e) => ({ ...e, aliases: e.name.split('|') })),
    ...(spec.rels || []).filter((r) => r.assoc).map((r) => ({ ...r, attrs: [], aliases: r.name.split('|'), isAssoc: true }))];

  const usedEnts = new Set();
  // primeiro os nomes exatos, para "VEICULO" não capturar "TIPO_VEICULO"
  const order = [...expEnts].sort((a, b) => Number(!allUserEnts.some((x) => a.aliases.some((al) => norm(al) === norm(x.name))))
    - Number(!allUserEnts.some((x) => b.aliases.some((al) => norm(al) === norm(x.name)))));
  const found = new Map();
  for (const e of order) {
    const u = bestMatch(allUserEnts, e.aliases, (x) => x.name, usedEnts);
    if (u) { usedEnts.add(u); found.set(e, u); }
  }
  for (const e of expEnts) {
    const u = found.get(e);
    if (!u) { if (!e.isAssoc) err(`Faltou a entidade <b>${esc(e.aliases[0])}</b>.`, e.why || ''); continue; }
    entMap[norm(e.aliases[0])] = u;
    if (e.isAssoc) continue;
    let fine = true;
    const expAttrs = (e.attrs || []).map(parseAttrSpec);
    for (const ea of expAttrs) {
      const ua = attrFind(u.attrs, ea);
      if (!ua) {
        // procurado em outro lugar?
        const elsewhere = S.entities.find((x) => x !== u && attrFind(x.attrs, ea)) || S.rels.find((x) => attrFind(x.attrs, ea));
        err(`<b>${esc(u.name)}</b>: falta o atributo <code>${esc(ea.name)}</code>${elsewhere ? ` (você o colocou em <b>${esc(elsewhere.name)}</b>)` : ''}.`);
        fine = false; continue;
      }
      if (ea.key && !ua.key) { err(`<b>${esc(u.name)}</b>: <code>${esc(ua.name)}</code> deveria ser identificador (●).`); fine = false; }
      if (!ea.key && ua.key && expAttrs.some((x) => x.key)) { err(`<b>${esc(u.name)}</b>: <code>${esc(ua.name)}</code> não é identificador neste minimundo.`); fine = false; }
      const ec = parseCard(ea.card || '(1,1)'), uc = parseCard(ua.card || '(1,1)');
      if (ec && uc && ec.max !== uc.max) { err(`<b>${esc(u.name)}</b>: <code>${esc(ua.name)}</code> ${ec.max === 'n' ? 'é multivalorado — indique a cardinalidade ' + ea.card : 'não é multivalorado'}.`); fine = false; }
      else if (ec && uc && ec.min !== uc.min) warn(`<b>${esc(u.name)}</b>: cardinalidade do atributo <code>${esc(ua.name)}</code> esperada ${ea.card || '(1,1)'}.`);
      if (ea.children.length) {
        const missingKids = ea.children.filter((c) => !attrFind(ua.children, c));
        if (missingKids.length) { err(`<b>${esc(u.name)}</b>: atributo composto <code>${esc(ua.name)}</code> deveria ter ${ea.children.map((c) => esc(c.name)).join(', ')}.`); fine = false; }
      }
    }
    if (!!e.weak !== !!u.weak) warn(`<b>${esc(u.name)}</b>: ${e.weak ? 'é uma entidade fraca (marque "entidade fraca").' : 'não é entidade fraca.'}`);
    if (fine) ok(`Entidade <b>${esc(u.name)}</b> e seus atributos.`);
  }
  for (const u of S.entities) {
    if (!Object.values(entMap).includes(u)) warn(`Entidade <b>${esc(u.name)}</b> não existe no gabarito.`, 'Pode ser um atributo ou relacionamento modelado como entidade — compare com o gabarito.');
  }

  // relacionamentos
  const usedRels = new Set();
  for (const r of spec.rels || []) {
    const aliases = r.name.split('|');
    const expEnds = (r.links || []).map(([ent, card, role]) => ({ key: norm(ent.split('|')[0]), card, role }));
    const want = expEnds.map((x) => entMap[x.key]?.id).filter(Boolean);
    if (want.length !== expEnds.length) { err(`Relacionamento <b>${esc(aliases[0])}</b>: falta alguma entidade participante.`); continue; }
    const sig = (ids) => [...ids].sort().join('|');
    const endIds = (ur) => ur.ends.map((en) => allUserEnts.find((x) => norm(x.name) === norm(en.ent))?.id).filter(Boolean);
    const cands = S.rels.filter((ur) => !usedRels.has(ur) && sig(endIds(ur)) === sig(want));
    let ur = cands.find((c) => aliases.some((al) => nameMatch(c.name, al))) || cands[0];
    if (!ur) {
      const byName = S.rels.find((c) => !usedRels.has(c) && aliases.some((al) => nameMatch(c.name, al)));
      if (byName) err(`Relacionamento <b>${esc(byName.name)}</b> deveria ligar ${expEnds.map((x) => esc(entMap[x.key]?.name || x.key)).join(', ')}.`);
      else err(`Faltou o relacionamento <b>${esc(aliases[0])}</b> entre ${expEnds.map((x) => esc(entMap[x.key]?.name || x.key)).join(' e ')}.`, r.why || '');
      continue;
    }
    usedRels.add(ur);
    // compara cardinalidades (tenta permutações quando há entidades repetidas)
    const userEnds = ur.ends.map((en) => ({ id: allUserEnts.find((x) => norm(x.name) === norm(en.ent))?.id, card: parseCard(en.card), raw: en.card, role: en.role }));
    const tryAssign = () => {
      let best = null;
      const perm = (arr, k = 0) => {
        if (k === arr.length) {
          let score = 0;
          const res = expEnds.map((x, i) => {
            const ue = arr[i];
            const ec = parseCard(x.card);
            const okMax = ue.card && ec && ue.card.max === ec.max, okMin = ue.card && ec && ue.card.min === ec.min;
            score += (ue.id === entMap[x.key].id ? 4 : 0) + (okMax ? 2 : 0) + (okMin ? 1 : 0);
            return { x, ue, okMax, okMin };
          });
          if (!best || score > best.score) best = { score, res };
          return;
        }
        for (let i = k; i < arr.length; i++) { [arr[k], arr[i]] = [arr[i], arr[k]]; perm(arr, k + 1); [arr[k], arr[i]] = [arr[i], arr[k]]; }
      };
      perm([...userEnds]);
      return best.res;
    };
    let fine = true;
    for (const { x, ue, okMax, okMin } of tryAssign()) {
      const eName = entMap[x.key].name;
      if (okMax && !okMin && r.lenientMin) {
        warn(`<b>${esc(ur.name)}</b>: junto a <b>${esc(eName)}</b> o gabarito usa <code>${x.card}</code> (você pôs <code>${esc(ue.raw)}</code>).`, 'Em relacionamentos n-ários a mínima é pouco expressiva; aqui só a máxima é obrigatória.');
      } else if (!okMax || !okMin) {
        fine = false;
        const others = expEnds.filter((y) => y !== x).map((y) => entMap[y.key].name);
        const read = others.length === 1
          ? `um(a) <b>${esc(others[0])}</b> se associa a no mín. ${parseCard(x.card).min} e no máx. ${parseCard(x.card).max} <b>${esc(eName)}</b>`
          : `para cada combinação (${others.map(esc).join(', ')}) há ${x.card} <b>${esc(eName)}</b>`;
        err(`<b>${esc(ur.name)}</b>: cardinalidade junto a <b>${esc(eName)}</b> deveria ser <code>${x.card}</code> (está <code>${esc(ue.raw || '—')}</code>).`,
          `${!okMax ? 'Máxima errada' : 'Mínima errada'} — ${read}. ${x.why || ''}`);
      }
    }
    // atributos do relacionamento
    for (const a of (r.attrs || []).map(parseAttrSpec)) {
      if (!attrFind(ur.attrs, a)) {
        const inEnt = S.entities.find((e) => attrFind(e.attrs, a));
        err(`<b>${esc(ur.name)}</b>: falta o atributo <code>${esc(a.name)}</code> no relacionamento${inEnt ? ` (está em <b>${esc(inEnt.name)}</b> — erro semântico: ele depende da associação, não só da entidade)` : ''}.`);
        fine = false;
      }
    }
    if (!!r.assoc !== !!ur.assoc && r.assoc) warn(`<b>${esc(ur.name)}</b> deveria ser uma entidade associativa (agregação).`);
    if (fine) ok(`Relacionamento <b>${esc(ur.name)}</b> com cardinalidades corretas.`);
  }
  for (const ur of S.rels) if (!usedRels.has(ur)) warn(`Relacionamento <b>${esc(ur.name)}</b> não está no gabarito.`, 'Verifique redundância: ele pode ser obtido pela combinação de outros?');

  // especializações
  for (const s of spec.specs || []) {
    const P = entMap[norm(s.parent)];
    const us = S.specs.find((x) => P && norm(x.parent) === norm(P.name));
    if (!us) { err(`Faltou a especialização de <b>${esc(s.parent)}</b> em ${s.children.map(esc).join(', ')}.`); continue; }
    const missing = s.children.filter((c) => !us.children.some((uc) => entMap[norm(c)] && norm(uc) === norm(entMap[norm(c)].name)));
    if (missing.length) err(`Especialização de <b>${esc(P.name)}</b>: faltam ${missing.map(esc).join(', ')}.`);
    if (norm(us.kind) !== norm(s.kind)) err(`Especialização de <b>${esc(P.name)}</b> deveria ser (${s.kind}); está (${esc(us.kind)}).`, 't = total, p = parcial; e = exclusiva (disjunta), i = inclusiva (sobreposta).');
    else if (!missing.length) ok(`Especialização de <b>${esc(P.name)}</b> (${s.kind}).`);
  }
  return { pass: errs === 0, items };
}

// ---------- editor interativo ----------
const ICONS = {
  select: '<svg viewBox="0 0 24 24"><path d="M5 3l14 8-6 2-2 6z"/></svg>',
  entity: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10"/></svg>',
  rel: '<svg viewBox="0 0 24 24"><path d="M12 4l9 8-9 8-9-8z"/></svg>',
  attr: '<svg viewBox="0 0 24 24"><path d="M3 12h12"/><circle cx="18" cy="12" r="3"/></svg>',
  keyattr: '<svg viewBox="0 0 24 24"><path d="M3 12h12"/><circle cx="18" cy="12" r="3" fill="currentColor"/></svg>',
  spec: '<svg viewBox="0 0 24 24"><path d="M12 5l7 12H5z"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M4 18L20 6"/><circle cx="4" cy="18" r="2"/><circle cx="20" cy="6" r="2"/></svg>',
  del: '<svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/></svg>',
  undo: '<svg viewBox="0 0 24 24"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/></svg>',
  fit: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  save: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  open: '<svg viewBox="0 0 24 24"><path d="M12 20V9M7 14l5-5 5 5M5 4h14"/></svg>',
  clear: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};
const HINTS = {
  select: 'Arraste elementos para mover • arraste o fundo para navegar • roda do mouse = zoom • Del apaga • Ctrl+Z desfaz • duplo clique renomeia',
  entity: 'Clique no espaço vazio para criar uma ENTIDADE.',
  rel: 'Clique no espaço vazio para criar um RELACIONAMENTO.',
  attr: 'Clique numa entidade, relacionamento ou atributo (para atributo composto) para adicionar um ATRIBUTO.',
  keyattr: 'Clique numa entidade para adicionar um ATRIBUTO IDENTIFICADOR (●).',
  spec: 'Clique na entidade GENÉRICA para criar a especialização; depois use "Ligar" do triângulo até cada entidade filha.',
  link: 'Clique no relacionamento (ou triângulo) e depois na entidade. Auto-relacionamento: ligue duas vezes.',
};
const CARDS = ['(0,1)', '(1,1)', '(0,n)', '(1,n)'];

export function createEditor(container, { model, readonly = false, onChange, height } = {}) {
  let m = model ? JSON.parse(JSON.stringify(model)) : emptyModel();
  let mode = 'select';
  let sel = null; // {id, kind:'node'|'link'}
  let view = { x: 0, y: 0, k: 1 };
  let pending = null;
  let drag = null;
  const undo = [];
  const snapshot = () => { undo.push(JSON.stringify(m)); if (undo.length > 60) undo.shift(); };
  const changed = () => { render(); if (onChange) onChange(m); };

  const root = h('div', { class: 'er' + (readonly ? ' readonly' : '') });
  const tools = h('div', { class: 'er-tools' });
  const canvas = h('div', { class: 'er-canvas' });
  if (height) canvas.style.height = height + 'px';
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  const g = document.createElementNS(svgNS, 'g');
  svg.append(g);
  canvas.append(svg);
  const hint = h('div', { class: 'er-hint' });
  canvas.append(hint);
  const props = h('div', { class: 'er-props' });
  root.append(tools, canvas);
  if (!readonly) root.append(props);
  container.append(root);

  const modeBtns = {};
  const tool = (key, label, title, fn) => {
    const b = h('button', { type: 'button', title, html: ICONS[key] + `<span>${label}</span>`, onclick: fn });
    tools.append(b);
    return b;
  };
  if (!readonly) {
    for (const [k, label] of [['select', 'Selecionar'], ['entity', 'Entidade'], ['rel', 'Relacionamento'], ['attr', 'Atributo'], ['keyattr', 'Identificador'], ['spec', 'Especialização'], ['link', 'Ligar']]) {
      modeBtns[k] = tool(k, label, HINTS[k], () => setMode(k));
    }
    tools.append(h('span', { class: 'sep' }));
    tool('del', 'Apagar', 'Apagar seleção (Del)', () => delSel());
    tool('undo', 'Desfazer', 'Desfazer (Ctrl+Z)', () => doUndo());
  }
  tool('fit', 'Enquadrar', 'Centralizar o diagrama', () => fit());
  if (!readonly) {
    tools.append(h('span', { class: 'sep' }));
    tool('save', 'Exportar', 'Baixar diagrama (.json) para reabrir depois', () => download('diagrama-er.json', JSON.stringify(m, null, 1)));
    tool('open', 'Importar', 'Abrir diagrama (.json)', () => {
      const inp = h('input', { type: 'file', accept: '.json,application/json' });
      inp.onchange = async () => {
        try { const data = JSON.parse(await inp.files[0].text()); if (!data.nodes) throw new Error(); snapshot(); m = data; sel = null; changed(); fit(); } catch { toast('Arquivo inválido.'); }
      };
      inp.click();
    });
    tool('clear', 'Limpar', 'Apagar tudo', () => { if (confirm('Apagar todo o diagrama?')) { snapshot(); m = emptyModel(); sel = null; changed(); } });
  }
  tool('save', 'SVG', 'Baixar imagem SVG', () => {
    const s = staticSVG(m, { maxWidth: 4000 }).replace(/var\(--er-fill\)/g, '#ffffff').replace(/var\(--er-ink\)/g, '#111111').replace(/var\(--er-sel\)/g, '#111111').replace(/var\(--mono, monospace\)/g, 'monospace');
    download('diagrama-er.svg', s, 'image/svg+xml');
  });

  function setMode(k) {
    mode = k; pending = null;
    for (const [key, b] of Object.entries(modeBtns)) b.classList.toggle('on', key === k);
    canvas.className = 'er-canvas ' + (k === 'select' ? 'mode-pan' : 'mode-add');
    hint.textContent = HINTS[k] || '';
    render();
  }

  function toWorld(e) {
    const r = svg.getBoundingClientRect();
    return { x: (e.clientX - r.left - view.x) / view.k, y: (e.clientY - r.top - view.y) / view.k };
  }
  function applyView() { g.setAttribute('transform', `translate(${view.x},${view.y}) scale(${view.k})`); }

  function render() {
    g.innerHTML = renderSVG(m, sel, { pending });
    applyView();
    if (!readonly) renderProps();
  }

  function fit() {
    const r = svg.getBoundingClientRect();
    if (!r.width) return;
    if (!m.nodes.length) { view = { x: 0, y: 0, k: 1 }; applyView(); return; }
    const b = bbox(m);
    const k = Math.min(1.3, Math.min(r.width / b.w, r.height / b.h));
    view = { k, x: (r.width - b.w * k) / 2 - b.x * k, y: (r.height - b.h * k) / 2 - b.y * k };
    applyView();
  }

  function addNode(type, pt, extra = {}) {
    snapshot();
    const count = m.nodes.filter((n) => n.type === type).length + 1;
    const n = { id: uid(m), type, x: Math.round(pt.x), y: Math.round(pt.y), name: type === 'entity' ? 'ENTIDADE' + count : type === 'rel' ? 'relac' + count : 'atributo' + count, ...extra };
    m.nodes.push(n);
    sel = { id: n.id, kind: 'node' };
    changed();
    focusName();
    return n;
  }

  function focusName() {
    const go = () => { const i = props.querySelector('input[data-name]'); if (i && document.activeElement !== i) { i.focus(); i.select(); } };
    go();
    setTimeout(go, 0);
  }

  function delSel() {
    if (!sel) return;
    snapshot();
    if (sel.kind === 'link') m.links = m.links.filter((l) => l.id !== sel.id);
    else {
      const kill = new Set([sel.id, ...descendants(m, sel.id).map((a) => a.id)]);
      for (const sp of m.nodes.filter((n) => n.type === 'spec' && n.owner === sel.id)) kill.add(sp.id);
      m.nodes = m.nodes.filter((n) => !kill.has(n.id));
      m.links = m.links.filter((l) => !kill.has(l.from) && !kill.has(l.to));
    }
    sel = null;
    changed();
  }
  function doUndo() {
    const s = undo.pop();
    if (!s) return toast('Nada para desfazer.');
    m = JSON.parse(s); sel = null; changed();
  }

  function tryLink(fromId, toId) {
    let A = byId(m, fromId), B = byId(m, toId);
    if (!A || !B) return;
    const isEnt = (n) => n.type === 'entity' || (n.type === 'rel' && n.assoc);
    // normaliza: from = relacionamento/especialização, to = entidade
    if ((A.type === 'entity') && (B.type === 'rel' || B.type === 'spec')) [A, B] = [B, A];
    if (A.type === 'rel' && B.type === 'rel') { if (B.assoc && !A.assoc) { /* ok */ } else if (A.assoc && !B.assoc) [A, B] = [B, A]; else return toast('Relacionamento só se liga a relacionamento se este for uma entidade associativa.'); }
    if (A.type === 'spec') {
      if (B.type !== 'entity') return toast('Ligue o triângulo a uma entidade especializada.');
      if (B.id === A.owner) return toast('Essa é a entidade genérica — ligue às filhas.');
      if (m.links.some((l) => l.from === A.id && l.to === B.id)) return toast('Já está ligada.');
      snapshot(); m.links.push({ id: uid(m), from: A.id, to: B.id, card: '' });
    } else if (A.type === 'rel' && isEnt(B)) {
      const n = m.links.filter((l) => l.from === A.id && l.to === B.id).length;
      if (n >= 2) return toast('Máximo de duas ligações entre o mesmo par.');
      snapshot();
      const l = { id: uid(m), from: A.id, to: B.id, card: '(0,n)', role: '' };
      m.links.push(l);
      sel = { id: l.id, kind: 'link' };
    } else return toast('Ligue um relacionamento a uma entidade (ou um triângulo de especialização a uma entidade filha).');
    changed();
  }

  // ---------- eventos ----------
  svg.addEventListener('pointerdown', (e) => {
    const pt = toWorld(e);
    const nodeEl = e.target.closest('[data-id]');
    const linkEl = e.target.closest('[data-link]');
    const node = nodeEl ? byId(m, nodeEl.dataset.id) : null;
    if (readonly) { drag = { pan: true, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y }; svg.setPointerCapture(e.pointerId); return; }
    if (mode !== 'select') e.preventDefault(); // não deixa o clique roubar o foco do campo de nome
    if (mode === 'entity' || mode === 'rel') {
      if (!node) { const t = mode; setMode('select'); addNode(t, pt, t === 'entity' ? { weak: false } : { assoc: false }); }
      return;
    }
    if (mode === 'attr' || mode === 'keyattr') {
      if (node && (node.type === 'entity' || node.type === 'rel' || node.type === 'attr')) {
        const p = placeAttr(m, node);
        addNode('attr', p, { owner: node.id, key: mode === 'keyattr', card: '' });
      } else toast('Clique sobre uma entidade, relacionamento ou atributo.');
      return;
    }
    if (mode === 'spec') {
      if (node && node.type === 'entity') {
        addNode('spec', { x: node.x, y: node.y + 95 }, { owner: node.id, kind: 't,e' });
        setMode('link');
        pending = { from: sel.id, x: node.x, y: node.y + 95 };
        hint.textContent = 'Agora clique em cada entidade especializada (filha).';
      } else toast('Clique sobre a entidade genérica.');
      return;
    }
    if (mode === 'link') {
      if (!node) { pending = null; render(); return; }
      if (!pending) { pending = { from: node.id, x: pt.x, y: pt.y }; render(); return; }
      tryLink(pending.from, node.id);
      const keep = byId(m, pending.from);
      pending = keep && keep.type === 'spec' ? { from: keep.id, x: pt.x, y: pt.y } : null;
      render();
      return;
    }
    // select
    if (node) {
      sel = { id: node.id, kind: 'node' };
      const group = [node, ...((node.type === 'entity' || node.type === 'rel' || node.type === 'attr') ? descendants(m, node.id) : [])];
      drag = { pt, items: group.map((n) => ({ n, x: n.x, y: n.y })), moved: false, before: JSON.stringify(m) };
      svg.setPointerCapture(e.pointerId);
      render();
    } else if (linkEl) {
      sel = { id: linkEl.dataset.link, kind: 'link' };
      render();
    } else {
      sel = null;
      drag = { pan: true, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
      svg.setPointerCapture(e.pointerId);
      render();
    }
  });
  svg.addEventListener('pointermove', (e) => {
    if (pending && mode === 'link') { const pt = toWorld(e); pending.x = pt.x; pending.y = pt.y; g.innerHTML = renderSVG(m, sel, { pending }); return; }
    if (!drag) return;
    if (drag.pan) { view.x = drag.vx + e.clientX - drag.sx; view.y = drag.vy + e.clientY - drag.sy; applyView(); return; }
    const pt = toWorld(e);
    const dx = pt.x - drag.pt.x, dy = pt.y - drag.pt.y;
    if (Math.abs(dx) + Math.abs(dy) > 1) drag.moved = true;
    for (const it of drag.items) { it.n.x = Math.round(it.x + dx); it.n.y = Math.round(it.y + dy); }
    g.innerHTML = renderSVG(m, sel, {});
  });
  const end = () => {
    if (drag && drag.moved) { undo.push(drag.before); if (onChange) onChange(m); }
    drag = null;
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  svg.addEventListener('dblclick', (e) => { if (!readonly && e.target.closest('[data-id]')) focusName(); });
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = svg.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const k2 = Math.max(0.3, Math.min(2.5, view.k * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
    view.x = mx - (mx - view.x) * (k2 / view.k);
    view.y = my - (my - view.y) * (k2 / view.k);
    view.k = k2;
    applyView();
  }, { passive: false });
  root.tabIndex = 0;
  root.addEventListener('keydown', (e) => {
    if (readonly || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); delSel(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); doUndo(); }
    if (e.key === 'Escape') { setMode('select'); }
  });

  // ---------- painel de propriedades ----------
  function renderProps() {
    props.innerHTML = '';
    if (!sel) {
      props.append(h('h4', {}, 'Propriedades'), h('p', { class: 'muted small' }, 'Selecione um elemento para editar nome, identificador, cardinalidade…'),
        h('div', { class: 'reading', html: 'Cardinalidade como em aula (Heuser/brModelo): o par <b>(mín,máx)</b> fica junto da entidade e responde “<i>um(a) OUTRA se associa a quantos(as) DESTA?</i>”' }));
      return;
    }
    if (sel.kind === 'link') {
      const l = m.links.find((x) => x.id === sel.id);
      if (!l) { sel = null; return renderProps(); }
      const A = byId(m, l.from), B = byId(m, l.to);
      props.append(h('h4', {}, A.type === 'spec' ? 'Ligação de especialização' : `Ligação ${A.name} — ${B.name}`));
      if (A.type !== 'spec') {
        props.append(h('label', {}, `Cardinalidade junto a ${B.name}`));
        const cardsDiv = h('div', { class: 'cards' });
        for (const c of CARDS) cardsDiv.append(h('button', { type: 'button', class: l.card === c ? 'on' : '', onclick: () => { snapshot(); l.card = c; changed(); } }, c));
        props.append(cardsDiv);
        const custom = h('input', { type: 'text', value: l.card, placeholder: '(1,3)' });
        custom.onchange = () => { snapshot(); l.card = custom.value.trim(); changed(); };
        props.append(h('label', {}, 'Outra (ex.: (1,3))'), custom);
        const role = h('input', { type: 'text', value: l.role || '', placeholder: 'ex.: chefe' });
        role.onchange = () => { snapshot(); l.role = role.value.trim(); changed(); };
        props.append(h('label', {}, 'Papel (auto-relacionamento)'), role);
        const idc = h('input', { type: 'checkbox' }); idc.checked = !!l.ident;
        idc.onchange = () => { snapshot(); l.ident = idc.checked; changed(); };
        props.append(h('label', { class: 'check' }, idc, 'Relacionamento identificador (entidade fraca)'));
        props.append(h('div', { class: 'reading', html: readingFor(m, l) }));
      }
      props.append(h('div', { style: { marginTop: '12px' } }, h('button', { class: 'btn small', onclick: delSel }, 'Apagar ligação')));
      return;
    }
    const n = byId(m, sel.id);
    if (!n) { sel = null; return renderProps(); }
    const title = { entity: 'Entidade', rel: 'Relacionamento', attr: 'Atributo', spec: 'Especialização' }[n.type];
    props.append(h('h4', {}, title));
    if (n.type !== 'spec') {
      const name = h('input', { type: 'text', value: n.name, 'data-name': '1' });
      name.oninput = () => { n.name = name.value; g.innerHTML = renderSVG(m, sel, {}); };
      name.onchange = () => { snapshot(); n.name = name.value.trim() || n.name; changed(); };
      name.onkeydown = (e) => { if (e.key === 'Enter') name.blur(); };
      props.append(h('label', {}, 'Nome'), name);
    }
    if (n.type === 'entity') {
      const wk = h('input', { type: 'checkbox' }); wk.checked = !!n.weak;
      wk.onchange = () => { snapshot(); n.weak = wk.checked; changed(); };
      props.append(h('label', { class: 'check' }, wk, 'Entidade fraca (identificador externo)'));
      props.append(h('div', { class: 'btnrow', style: { marginTop: '8px' } },
        h('button', { class: 'btn small', onclick: () => addNode('attr', placeAttr(m, n), { owner: n.id, key: false, card: '' }) }, '+ atributo'),
        h('button', { class: 'btn small', onclick: () => addNode('attr', placeAttr(m, n), { owner: n.id, key: true, card: '' }) }, '+ identificador')));
    }
    if (n.type === 'rel') {
      const as = h('input', { type: 'checkbox' }); as.checked = !!n.assoc;
      as.onchange = () => { snapshot(); n.assoc = as.checked; changed(); };
      props.append(h('label', { class: 'check' }, as, 'Entidade associativa (agregação)'));
      props.append(h('div', { class: 'btnrow', style: { marginTop: '8px' } },
        h('button', { class: 'btn small', onclick: () => addNode('attr', placeAttr(m, n), { owner: n.id, key: false, card: '' }) }, '+ atributo')));
      const ls = m.links.filter((l) => l.from === n.id);
      if (ls.length) {
        props.append(h('label', {}, 'Cardinalidades'));
        for (const l of ls) {
          const B = byId(m, l.to);
          const s = h('select', {}, [...new Set([...CARDS, l.card])].map((c) => h('option', { value: c, selected: c === l.card }, c)));
          s.onchange = () => { snapshot(); l.card = s.value; changed(); };
          props.append(h('div', { style: { display: 'flex', gap: '6px', alignItems: 'center', margin: '4px 0' } }, h('span', { style: { flex: 1 } }, B?.name + (l.role ? ` (${l.role})` : '')), s));
          props.append(h('div', { class: 'reading', style: { marginTop: '2px' }, html: readingFor(m, l) }));
        }
      }
    }
    if (n.type === 'attr') {
      const k = h('input', { type: 'checkbox' }); k.checked = !!n.key;
      k.onchange = () => { snapshot(); n.key = k.checked; changed(); };
      props.append(h('label', { class: 'check' }, k, 'Identificador (●)'));
      const opts = ['', '(0,1)', '(0,n)', '(1,n)'];
      const s = h('select', {}, opts.map((c) => h('option', { value: c, selected: (n.card || '') === c }, c || '(1,1) — padrão')));
      s.onchange = () => { snapshot(); n.card = s.value; changed(); };
      props.append(h('label', {}, 'Cardinalidade do atributo'), s,
        h('p', { class: 'muted small' }, '(0,1) opcional • (0,n)/(1,n) multivalorado'));
      props.append(h('button', { class: 'btn small', onclick: () => addNode('attr', placeAttr(m, n), { owner: n.id, key: false, card: '' }) }, '+ sub-atributo (composto)'));
    }
    if (n.type === 'spec') {
      const s = h('select', {}, [['t,e', 'total, exclusiva (t,e)'], ['p,e', 'parcial, exclusiva (p,e)'], ['t,i', 'total, inclusiva (t,i)'], ['p,i', 'parcial, inclusiva (p,i)']].map(([v, t]) => h('option', { value: v, selected: n.kind === v }, t)));
      s.onchange = () => { snapshot(); n.kind = s.value; changed(); };
      props.append(h('label', {}, 'Cobertura'), s);
      const kids = m.links.filter((l) => l.from === n.id).map((l) => byId(m, l.to)?.name);
      props.append(h('p', { class: 'small' }, 'Filhas: ' + (kids.join(', ') || '— (use Ligar)')));
      props.append(h('button', { class: 'btn small', onclick: () => { setMode('link'); pending = { from: n.id, x: n.x, y: n.y }; } }, 'Ligar filhas'));
    }
    props.append(h('div', { style: { marginTop: '12px' } }, h('button', { class: 'btn small', onclick: delSel }, 'Apagar')));
  }

  if (!readonly) setMode('select'); else { hint.textContent = 'Arraste para navegar • roda do mouse = zoom'; canvas.className = 'er-canvas mode-pan'; }
  render();
  requestAnimationFrame(fit);
  return {
    get model() { return m; },
    set(model2) { m = JSON.parse(JSON.stringify(model2)); sel = null; render(); requestAnimationFrame(fit); },
    fit, el: root,
  };
}
