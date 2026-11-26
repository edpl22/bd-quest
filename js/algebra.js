// Interpretador de Álgebra Relacional (sintaxe estilo RelaX / notas de aula).
// Traduz a expressão para SQL (com semântica de conjunto) e executa no PGlite.
//
// Operadores aceitos (símbolo | palavra):
//   σ sigma   π pi   ρ rho   γ gamma   τ tau
//   ⋈ ⨝ join   × "cross join"   ∪ union   ∩ intersect   − - except minus   ÷ divide
//   ⟕ "left join"   ⟖ "right join"   ⟗ "full join"
//   ∧ and   ∨ or   ¬ not   ≠ <> !=   ≤ <=   ≥ >=   ← = (atribuição)   → (renomear/alias)

import { norm } from './util.js';

export class RAError extends Error {}

const SYM = {
  'σ': 'SIGMA', 'π': 'PI', 'ρ': 'RHO', 'γ': 'GAMMA', 'τ': 'TAU',
  '⋈': 'JOIN', '⨝': 'JOIN', '×': 'CROSS', '⨯': 'CROSS', '∪': 'UNION', '∩': 'INTERSECT', '−': 'MINUS', '÷': 'DIVIDE',
  '⟕': 'LJOIN', '⟖': 'RJOIN', '⟗': 'FJOIN', '∧': 'AND', '∨': 'OR', '¬': 'NOT',
  '≠': 'NE', '≤': 'LE', '≥': 'GE', '←': 'ASSIGN', '→': 'ARROW',
  'ℑ': 'FGAMMA', 'ℱ': 'FGAMMA', '𝓕': 'FGAMMA',
};
const WORDS = {
  sigma: 'SIGMA', pi: 'PI', rho: 'RHO', gamma: 'GAMMA', tau: 'TAU', join: 'JOIN', union: 'UNION', intersect: 'INTERSECT',
  except: 'MINUS', minus: 'MINUS', divide: 'DIVIDE', and: 'AND', or: 'OR', not: 'NOT', asc: 'ASC', desc: 'DESC',
};

function tokenize(src) {
  const toks = [];
  let i = 0;
  const n = src.length;
  const push = (type, value, pos) => toks.push({ type, value, pos });
  while (i < n) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '-' && src[i + 1] === '-') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { const j = src.indexOf('*/', i + 2); i = j < 0 ? n : j + 2; continue; }
    if (SYM[c]) { push(SYM[c], c, i); i++; continue; }
    const cp = src.codePointAt(i);
    if (cp > 0xffff && SYM[String.fromCodePoint(cp)]) { push(SYM[String.fromCodePoint(cp)], String.fromCodePoint(cp), i); i += 2; continue; }
    if (c === "'" || c === '"') {
      let j = i + 1, s = '';
      while (j < n && src[j] !== c) { s += src[j]; j++; }
      if (j >= n) throw new RAError(`Texto não fechado (falta ${c}).`);
      push('STR', s, i); i = j + 1; continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i; while (j < n && /[0-9.]/.test(src[j])) j++;
      push('NUM', src.slice(i, j), i); i = j; continue;
    }
    if (/[\p{L}_]/u.test(c)) {
      let j = i; while (j < n && /[\p{L}\p{N}_#]/u.test(src[j])) j++;
      const w = src.slice(i, j);
      const lw = w.toLowerCase();
      // palavras compostas: cross join, left/right/full [outer] join, natural join
      const rest = src.slice(j);
      const m2 = /^\s+(outer\s+)?join\b/i.exec(rest);
      if (['left', 'right', 'full'].includes(lw) && m2) { push({ left: 'LJOIN', right: 'RJOIN', full: 'FJOIN' }[lw], w, i); i = j + m2[0].length; continue; }
      if ((lw === 'cross' || lw === 'natural') && /^\s+join\b/i.test(rest)) {
        const m = /^\s+join\b/i.exec(rest); push(lw === 'cross' ? 'CROSS' : 'JOIN', w, i); i = j + m[0].length; continue;
      }
      if (WORDS[lw]) { push(WORDS[lw], w, i); i = j; continue; }
      push('ID', w, i); i = j; continue;
    }
    const two = src.slice(i, i + 2);
    if (two === '<>' || two === '!=') { push('NE', two, i); i += 2; continue; }
    if (two === '<=') { push('LE', two, i); i += 2; continue; }
    if (two === '>=') { push('GE', two, i); i += 2; continue; }
    if (two === '->') { push('ARROW', two, i); i += 2; continue; }
    if (two === '<-') { push('ASSIGN', two, i); i += 2; continue; }
    const one = { '(': 'LP', ')': 'RP', ',': 'COMMA', ';': 'SEMI', '.': 'DOT', '=': 'EQ', '<': 'LT', '>': 'GT', '*': 'STAR', '+': 'PLUS', '-': 'MINUS', '/': 'SLASH', '[': 'LB', ']': 'RB', '{': 'LB', '}': 'RB' }[c];
    if (one) { push(one, c, i); i++; continue; }
    throw new RAError(`Símbolo não reconhecido: "${c}"`);
  }
  push('EOF', '', n);
  return toks;
}

// ---------------- parser ----------------
class Parser {
  constructor(toks) { this.t = toks; this.i = 0; }
  peek(k = 0) { return this.t[this.i + k]; }
  is(type, k = 0) { return this.peek(k).type === type; }
  next() { return this.t[this.i++]; }
  accept(type) { if (this.is(type)) return this.next(); return null; }
  expect(type, what) {
    if (this.is(type)) return this.next();
    const tk = this.peek();
    throw new RAError(`Esperava ${what || type} mas encontrei "${tk.value || 'fim'}".`);
  }

  program() {
    const stmts = [];
    while (!this.is('EOF')) {
      while (this.accept('SEMI'));
      if (this.is('EOF')) break;
      // atribuição: X ← expr | X = expr | X(a,b) ← expr
      if (this.is('ID') && (this.is('ASSIGN', 1) || this.is('EQ', 1))) {
        const name = this.next().value; this.next();
        stmts.push({ assign: name, attrs: null, expr: this.expr() });
        continue;
      }
      if (this.is('ID') && this.is('LP', 1)) {
        const save = this.i;
        this.next(); this.next();
        const ids = [];
        let ok = true;
        while (true) {
          if (!this.is('ID')) { ok = false; break; }
          ids.push(this.next().value);
          if (this.accept('COMMA')) continue;
          break;
        }
        if (ok && this.accept('RP') && (this.accept('ASSIGN') || this.accept('EQ'))) {
          stmts.push({ assign: this.t[save].value, attrs: ids, expr: this.expr() });
          continue;
        }
        this.i = save;
      }
      stmts.push({ assign: null, expr: this.expr() });
    }
    if (!stmts.length) throw new RAError('Expressão vazia.');
    return stmts;
  }

  // nível 1: ∪ ∩ − ÷
  expr() {
    let left = this.joinExpr();
    while (['UNION', 'INTERSECT', 'MINUS', 'DIVIDE'].includes(this.peek().type)) {
      const op = this.next().type;
      left = { op, l: left, r: this.joinExpr() };
    }
    return left;
  }

  // nível 2: ⋈ × ⟕ ⟖ ⟗
  joinExpr() {
    let left = this.unary();
    while (['JOIN', 'CROSS', 'LJOIN', 'RJOIN', 'FJOIN'].includes(this.peek().type)) {
      const op = this.next().type;
      let cond = null;
      if (op !== 'CROSS') {
        if (this.accept('LB')) { cond = this.cond(); this.expect('RB', '] fechando a condição da junção'); }
        else if (this.looksLikeCond()) cond = this.cond();
      }
      left = { op, l: left, r: this.unary(), cond };
    }
    return left;
  }

  // depois de ⋈: há uma condição antes do operando?
  looksLikeCond() {
    let k = 0;
    if (this.is('LP')) {
      // "(a = b) R" vs "(R)" — procura comparador antes do parêntese fechar
      let depth = 0;
      for (let j = this.i; j < this.t.length; j++) {
        const ty = this.t[j].type;
        if (ty === 'LP') depth++;
        else if (ty === 'RP') { depth--; if (depth === 0) return false; }
        else if (depth === 1 && ['EQ', 'NE', 'LT', 'GT', 'LE', 'GE'].includes(ty)) return true;
        else if (depth === 1 && ['SIGMA', 'PI', 'RHO', 'GAMMA', 'JOIN', 'CROSS', 'UNION', 'MINUS'].includes(ty)) return false;
      }
      return false;
    }
    if (this.is('NOT')) return true;
    if (this.is('ID') || this.is('NUM') || this.is('STR')) {
      k = 1;
      if (this.is('ID') && this.is('DOT', 1) && this.is('ID', 2)) k = 3;
      return ['EQ', 'NE', 'LT', 'GT', 'LE', 'GE', 'PLUS', 'STAR', 'SLASH'].includes(this.peek(k).type);
    }
    return false;
  }

  unary() {
    const tk = this.peek();
    switch (tk.type) {
      case 'SIGMA': {
        this.next(); this.subscriptStart();
        let cond;
        if (this.accept('LB')) { cond = this.cond(); this.expect('RB', '] fechando o σ[…]'); } else cond = this.cond();
        return { op: 'SELECT', cond, e: this.operand() };
      }
      case 'PI': {
        this.next(); this.subscriptStart();
        const items = this.bracketed(() => this.list(() => this.projItem()), 'π') || this.listMaybeParen(() => this.projItem());
        return { op: 'PROJECT', items, e: this.operand() };
      }
      case 'TAU': {
        this.next(); this.subscriptStart();
        const sortItem = () => {
          const a = this.attrRef();
          let dir = 'ASC';
          if (this.accept('DESC')) dir = 'DESC'; else this.accept('ASC');
          return { a, dir };
        };
        const items = this.bracketed(() => this.list(sortItem), 'τ') || this.listMaybeParen(sortItem);
        return { op: 'SORT', items, e: this.operand() };
      }
      case 'RHO': {
        this.next(); this.subscriptStart();
        if (this.accept('LB')) {
          const r = this.renameSpec(true);
          this.expect('RB', '] fechando o ρ[…]');
          return { ...r, e: this.operand() };
        }
        return this.rename();
      }
      case 'GAMMA': {
        this.next(); this.subscriptStart();
        if (this.accept('LB')) {
          const g = this.gammaSpec();
          this.expect('RB', '] fechando o γ[…]');
          return { op: 'GROUP', ...g, e: this.operand() };
        }
        return this.gamma();
      }
      case 'FGAMMA': { // notação de aula sem agrupamento: ℑ COUNT(*) (R)
        this.next();
        return this.fgammaRest([]);
      }
      case 'LP': {
        this.next();
        const e = this.expr();
        this.expect('RP', ')');
        return e;
      }
      case 'ID': {
        // notação de aula: dnum ℑ COUNT(mat) (R)  — atributos de grupo à esquerda do ℑ
        let k = 0;
        while (this.is('ID', k)) {
          k++;
          if (this.is('DOT', k) && this.is('ID', k + 1)) k += 2;
          if (this.is('FGAMMA', k)) break;
          if (this.is('COMMA', k)) { k++; continue; }
          break;
        }
        if (this.is('FGAMMA', k)) {
          const groups = [this.attrRef()];
          while (this.accept('COMMA')) groups.push(this.attrRef());
          this.expect('FGAMMA', 'ℑ');
          return this.fgammaRest(groups);
        }
        this.next();
        return { op: 'REL', name: tk.value };
      }
      default:
        throw new RAError(`Esperava uma relação ou operador mas encontrei "${tk.value || 'fim da expressão'}".`);
    }
  }

  subscriptStart() { // aceita σ_ ... e σ_{...}
    if (this.is('ID') && this.peek().value === '_') this.next();
  }

  // [ … ] logo após o operador: o "subscrito" do papel
  bracketed(fn, opName) {
    if (!this.accept('LB')) return null;
    const v = fn();
    this.expect('RB', `] fechando o ${opName}[…]`);
    return v;
  }
  list(item) {
    const items = [item()];
    while (this.accept('COMMA')) items.push(item());
    return items;
  }

  // dentro de ρ[…]: X | X(a, b) | novo ← velho, … | velho → novo, …
  renameSpec() {
    if (this.is('ID') && (this.is('ASSIGN', 1) || this.is('ARROW', 1) || (this.is('DOT', 1) && (this.is('ASSIGN', 3) || this.is('ARROW', 3))))) {
      const pairs = [];
      do {
        const a = this.attrRef();
        const arrow = this.next().type;
        if (arrow !== 'ASSIGN' && arrow !== 'ARROW') throw new RAError('Em ρ[…] use novo ← velho (ou velho → novo).');
        const b = this.attrRef();
        pairs.push(arrow === 'ASSIGN' ? { to: a.name, from: b } : { to: b.name, from: a });
      } while (this.accept('COMMA'));
      return { op: 'RENAME_ATTR', pairs };
    }
    const name = this.expect('ID', 'novo nome da relação').value;
    let attrs = null;
    if (this.accept('LP')) { attrs = this.list(() => this.expect('ID', 'nome de atributo').value); this.expect('RP', ')'); }
    return { op: 'RENAME_REL', name, attrs };
  }

  // dentro de γ[…]: grupos; funções   (o ";" é opcional: funções são reconhecidas pelo nome)
  aggItem() {
    if (this.is('ID') && this.is('LP', 1) && /^(count|sum|avg|min|max)$/i.test(this.peek().value)) {
      const fn = this.next().value.toUpperCase(); this.next();
      let distinct = false;
      if (this.is('ID') && /^distinct$/i.test(this.peek().value)) { this.next(); distinct = true; }
      const arg = this.accept('STAR') ? '*' : this.attrRef();
      this.expect('RP', ')');
      let alias = null;
      if (this.accept('ARROW')) alias = this.expect('ID', 'nome do resultado').value;
      return { fn, arg, distinct, alias: alias || (fn.toLowerCase() + (arg === '*' ? '' : '_' + arg.name)) };
    }
    return null;
  }
  gammaSpec() {
    const groups = [], aggs = [];
    const one = () => { const a = this.aggItem(); if (a) aggs.push(a); else groups.push(this.attrRef()); };
    if (!this.is('SEMI') && !this.is('RB')) { one(); while (this.accept('COMMA')) one(); }
    if (this.accept('SEMI')) { one(); while (this.accept('COMMA')) one(); }
    if (!aggs.length && !groups.length) throw new RAError('γ[…] precisa de atributos de agrupamento e/ou funções (count, sum, avg, min, max).');
    return { groups, aggs };
  }
  // depois do ℑ: funções, com ou sem colchetes, e o operando
  fgammaRest(groups) {
    const parseAggs = () => {
      const aggs = [];
      do {
        const a = this.aggItem();
        if (!a) throw new RAError('Depois do ℑ vêm as funções de agregação: COUNT(x), SUM(x), AVG(x), MIN(x), MAX(x).');
        aggs.push(a);
      } while (this.accept('COMMA'));
      return aggs;
    };
    const aggs = this.bracketed(parseAggs, 'ℑ') || parseAggs();
    return { op: 'GROUP', groups, aggs, e: this.operand() };
  }

  operand() {
    if (this.is('LP') || this.is('ID') || ['SIGMA', 'PI', 'RHO', 'GAMMA', 'TAU', 'FGAMMA'].includes(this.peek().type)) return this.unary();
    throw new RAError(`Faltou a relação depois do operador, entre parênteses: ex. σ[cond](EMPREGADO). Encontrei "${this.peek().value || 'fim'}".`);
  }

  listMaybeParen(item) {
    // π (a, b) (R)  |  π a, b (R)
    if (this.is('LP')) {
      const save = this.i;
      this.next();
      try {
        const items = [item()];
        while (this.accept('COMMA')) items.push(item());
        if (this.accept('RP') && (this.is('LP') || this.is('ID') || ['SIGMA', 'PI', 'RHO', 'GAMMA', 'TAU'].includes(this.peek().type))) return items;
      } catch { /* tenta sem parênteses */ }
      this.i = save;
    }
    const items = [item()];
    while (this.accept('COMMA')) items.push(item());
    return items;
  }

  projItem() {
    const e = this.arith();
    if (this.accept('ARROW')) return { e, alias: this.expect('ID', 'nome do novo atributo').value };
    return { e };
  }

  rename() {
    // ρ X (R) | ρ X(a,b) (R) | ρ novo←velho, ... (R) | ρ velho→novo (R)
    if (this.is('ID') && (this.is('ASSIGN', 1) || this.is('ARROW', 1))) {
      const pairs = [];
      do {
        const a = this.attrRef();
        const arrow = this.next().type;
        const b = this.attrRef();
        pairs.push(arrow === 'ASSIGN' ? { to: a.name, from: b } : { to: b.name, from: a });
      } while (this.accept('COMMA'));
      return { op: 'RENAME_ATTR', pairs, e: this.operand() };
    }
    const name = this.expect('ID', 'novo nome da relação').value;
    if (this.is('LP')) {
      const save = this.i;
      this.next();
      const ids = [];
      let ok = true;
      while (true) {
        if (!this.is('ID')) { ok = false; break; }
        ids.push(this.next().value);
        if (!this.accept('COMMA')) break;
      }
      if (ok && this.accept('RP') && (this.is('LP') || this.is('ID') || ['SIGMA', 'PI', 'RHO', 'GAMMA', 'TAU'].includes(this.peek().type))) {
        return { op: 'RENAME_REL', name, attrs: ids, e: this.operand() };
      }
      this.i = save;
    }
    return { op: 'RENAME_REL', name, attrs: null, e: this.operand() };
  }

  gamma() {
    // γ g1, g2; count(*)→n, sum(x)→s (R)
    const groups = [], aggs = [];
    const parseItem = () => {
      if (this.is('ID') && this.is('LP', 1) && /^(count|sum|avg|min|max)$/i.test(this.peek().value)) {
        const fn = this.next().value.toUpperCase(); this.next();
        let arg = null;
        if (this.accept('STAR')) arg = '*'; else arg = this.attrRef();
        this.expect('RP', ')');
        let alias = null;
        if (this.accept('ARROW')) alias = this.expect('ID', 'nome do resultado').value;
        aggs.push({ fn, arg, alias: alias || (fn.toLowerCase() + (arg === '*' ? '' : '_' + arg.name)) });
      } else groups.push(this.attrRef());
    };
    let inParen = false;
    if (this.is('LP') && !(this.is('ID', 1) && this.is('LP', 2))) { /* lista pode estar em parênteses */ }
    if (!this.is('SEMI')) {
      parseItem();
      while (this.accept('COMMA')) parseItem();
    }
    if (this.accept('SEMI')) {
      parseItem();
      while (this.accept('COMMA')) parseItem();
    }
    void inParen;
    if (!aggs.length && !groups.length) throw new RAError('γ precisa de atributos de agrupamento e/ou funções de agregação.');
    return { op: 'GROUP', groups, aggs, e: this.operand() };
  }

  attrRef() {
    const a = this.expect('ID', 'nome de atributo').value;
    if (this.accept('DOT')) return { rel: a, name: this.expect('ID', 'atributo após o ponto').value };
    return { rel: null, name: a };
  }

  // condições
  cond() {
    let l = this.condAnd();
    while (this.accept('OR')) l = { bool: 'OR', l, r: this.condAnd() };
    return l;
  }
  condAnd() {
    let l = this.condNot();
    while (this.accept('AND')) l = { bool: 'AND', l, r: this.condNot() };
    return l;
  }
  condNot() {
    if (this.accept('NOT')) return { bool: 'NOT', e: this.condNot() };
    if (this.is('LP')) {
      // parêntese de condição
      const save = this.i;
      this.next();
      try {
        const c = this.cond();
        if (this.accept('RP')) return c;
      } catch { /* talvez seja aritmética */ }
      this.i = save;
    }
    const l = this.arith();
    const opTok = this.peek();
    const ops = { EQ: '=', NE: '<>', LT: '<', GT: '>', LE: '<=', GE: '>=' };
    if (!ops[opTok.type]) throw new RAError(`Esperava um comparador (=, ≠, <, >, ≤, ≥) perto de "${opTok.value || 'fim'}".`);
    this.next();
    return { cmp: ops[opTok.type], l, r: this.arith() };
  }
  arith() {
    let l = this.term();
    while (['PLUS', 'MINUS', 'STAR', 'SLASH'].includes(this.peek().type)) {
      // "-" pode ser diferença de conjuntos; só vale como aritmética se seguido de número/atributo e não de relação conhecida
      const op = { PLUS: '+', MINUS: '-', STAR: '*', SLASH: '/' }[this.next().type];
      l = { arith: op, l, r: this.term() };
    }
    return l;
  }
  term() {
    const tk = this.peek();
    if (tk.type === 'NUM') { this.next(); return { num: tk.value }; }
    if (tk.type === 'STR') { this.next(); return { str: tk.value }; }
    if (tk.type === 'ID') {
      if (/^null$/i.test(tk.value)) { this.next(); return { nul: true }; }
      return { ref: this.attrRef() };
    }
    if (tk.type === 'MINUS' && this.is('NUM', 1)) { this.next(); return { num: '-' + this.next().value }; }
    throw new RAError(`Esperava atributo, número ou 'texto' mas encontrei "${tk.value || 'fim'}".`);
  }
}

// ---------------- tradução para SQL ----------------

const disp = (c) => c.name;

function resolve(cols, ref) {
  const nm = norm(ref.name);
  let cands = cols.map((c, i) => ({ c, i })).filter(({ c }) => norm(c.name) === nm);
  if (ref.rel) cands = cands.filter(({ c }) => c.rel && norm(c.rel) === norm(ref.rel));
  if (!cands.length) {
    const avail = cols.map((c) => (c.rel ? c.rel + '.' : '') + c.name).join(', ');
    throw new RAError(`Atributo "${ref.rel ? ref.rel + '.' : ''}${ref.name}" não existe aqui. Disponíveis: ${avail}`);
  }
  if (cands.length > 1) {
    const opts = cands.map(({ c }) => (c.rel || '?') + '.' + c.name).join(' ou ');
    throw new RAError(`Atributo "${ref.name}" é ambíguo (${opts}). Qualifique (R.atributo) ou use ρ para renomear.`);
  }
  return cands[0].i;
}

const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";

function condSQL(c, cols, colExpr) {
  if (c.bool === 'AND' || c.bool === 'OR') return `(${condSQL(c.l, cols, colExpr)} ${c.bool} ${condSQL(c.r, cols, colExpr)})`;
  if (c.bool === 'NOT') return `(NOT ${condSQL(c.e, cols, colExpr)})`;
  if (c.cmp) {
    const l = arithSQL(c.l, cols, colExpr), r = arithSQL(c.r, cols, colExpr);
    if (c.r.nul) return `(${l} IS ${c.cmp === '=' ? '' : 'NOT '}NULL)`;
    return `(${l} ${c.cmp} ${r})`;
  }
  throw new RAError('Condição inválida.');
}
function arithSQL(a, cols, colExpr) {
  if (a.num !== undefined) return a.num;
  if (a.str !== undefined) return q(a.str);
  if (a.nul) return 'NULL';
  if (a.ref) return colExpr(resolve(cols, a.ref));
  if (a.arith) return `(${arithSQL(a.l, cols, colExpr)} ${a.arith} ${arithSQL(a.r, cols, colExpr)})`;
  throw new RAError('Expressão inválida.');
}
function arithName(a) {
  if (a.ref) return a.ref.name;
  return 'expr';
}

const selList = (n, alias, offset = 0) => Array.from({ length: n }, (_, i) => `${alias}.c${i + 1} AS c${i + 1 + offset}`).join(', ');

export function translate(src, catalog, schema) {
  const toks = tokenize(src);
  const stmts = new Parser(toks).program();
  const env = {};
  let last = null;

  function base(name) {
    const key = norm(name);
    if (env[key]) return { ...env[key], cols: env[key].cols.map((c) => ({ ...c })) };
    const tname = Object.keys(catalog).find((t) => norm(t) === key);
    if (!tname) throw new RAError(`Relação "${name}" não existe. Relações: ${Object.keys(catalog).join(', ')}${Object.keys(env).length ? '; variáveis: ' + Object.values(env).map((v) => v.label).join(', ') : ''}`);
    const cols = catalog[tname].map((c) => ({ rel: tname, name: c }));
    const sql = `SELECT DISTINCT ${cols.map((c, i) => `"${c.name}" AS c${i + 1}`).join(', ')} FROM ${schema}."${tname}"`;
    return { sql, cols };
  }

  function tr(node) {
    switch (node.op) {
      case 'REL': return base(node.name);
      case 'SELECT': {
        const s = tr(node.e);
        const w = condSQL(node.cond, s.cols, (i) => `t.c${i + 1}`);
        return { sql: `SELECT * FROM (${s.sql}) t WHERE ${w}`, cols: s.cols };
      }
      case 'PROJECT': {
        const s = tr(node.e);
        const cols = [], parts = [];
        node.items.forEach((it, k) => {
          const ex = arithSQL(it.e, s.cols, (i) => `t.c${i + 1}`);
          parts.push(`${ex} AS c${k + 1}`);
          if (it.alias) cols.push({ rel: null, name: it.alias });
          else if (it.e.ref) { const src = s.cols[resolve(s.cols, it.e.ref)]; cols.push({ ...src }); }
          else cols.push({ rel: null, name: arithName(it.e) });
        });
        return { sql: `SELECT DISTINCT ${parts.join(', ')} FROM (${s.sql}) t`, cols };
      }
      case 'SORT': {
        const s = tr(node.e);
        const ob = node.items.map((it) => `t.c${resolve(s.cols, it.a) + 1} ${it.dir}`).join(', ');
        return { sql: `SELECT * FROM (${s.sql}) t ORDER BY ${ob}`, cols: s.cols, sorted: true };
      }
      case 'RENAME_REL': {
        const s = tr(node.e);
        if (node.attrs && node.attrs.length !== s.cols.length) throw new RAError(`ρ ${node.name}(...) tem ${node.attrs.length} nomes, mas a relação tem ${s.cols.length} atributos.`);
        return { sql: s.sql, cols: s.cols.map((c, i) => ({ rel: node.name, name: node.attrs ? node.attrs[i] : c.name })) };
      }
      case 'RENAME_ATTR': {
        const s = tr(node.e);
        const cols = s.cols.map((c) => ({ ...c }));
        for (const p of node.pairs) cols[resolve(s.cols, p.from)].name = p.to;
        return { sql: s.sql, cols };
      }
      case 'CROSS': {
        const L = tr(node.l), R = tr(node.r);
        return {
          sql: `SELECT ${selList(L.cols.length, 'l')}, ${selList(R.cols.length, 'r', L.cols.length)} FROM (${L.sql}) l CROSS JOIN (${R.sql}) r`,
          cols: [...L.cols, ...R.cols],
        };
      }
      case 'JOIN': case 'LJOIN': case 'RJOIN': case 'FJOIN': {
        const L = tr(node.l), R = tr(node.r);
        const kind = { JOIN: 'JOIN', LJOIN: 'LEFT JOIN', RJOIN: 'RIGHT JOIN', FJOIN: 'FULL JOIN' }[node.op];
        const nl = L.cols.length;
        if (node.cond) {
          const all = [...L.cols, ...R.cols];
          const on = condSQL(node.cond, all, (i) => (i < nl ? `l.c${i + 1}` : `r.c${i - nl + 1}`));
          return { sql: `SELECT ${selList(nl, 'l')}, ${selList(R.cols.length, 'r', nl)} FROM (${L.sql}) l ${kind} (${R.sql}) r ON ${on}`, cols: all };
        }
        // junção natural: atributos de mesmo nome
        const pairs = [];
        R.cols.forEach((rc, j) => {
          const i = L.cols.findIndex((lc) => norm(lc.name) === norm(rc.name));
          if (i >= 0) pairs.push([i, j]);
        });
        if (!pairs.length) {
          if (node.op !== 'JOIN') throw new RAError('Junção externa natural sem atributos em comum. Informe a condição.');
          return tr({ op: 'CROSS', l: node.l, r: node.r });
        }
        const rKeep = R.cols.map((c, j) => j).filter((j) => !pairs.some((p) => p[1] === j));
        const lSel = L.cols.map((c, i) => {
          const p = pairs.find((x) => x[0] === i);
          if (p && (node.op === 'RJOIN' || node.op === 'FJOIN')) return `COALESCE(l.c${i + 1}, r.c${p[1] + 1}) AS c${i + 1}`;
          return `l.c${i + 1} AS c${i + 1}`;
        });
        const rSel = rKeep.map((j, k) => `r.c${j + 1} AS c${nl + k + 1}`);
        const on = pairs.map(([i, j]) => `l.c${i + 1} = r.c${j + 1}`).join(' AND ');
        return {
          sql: `SELECT ${[...lSel, ...rSel].join(', ')} FROM (${L.sql}) l ${kind} (${R.sql}) r ON ${on}`,
          cols: [...L.cols, ...rKeep.map((j) => R.cols[j])],
        };
      }
      case 'UNION': case 'INTERSECT': case 'MINUS': {
        const L = tr(node.l), R = tr(node.r);
        const sym = { UNION: '∪', INTERSECT: '∩', MINUS: '−' }[node.op];
        if (L.cols.length !== R.cols.length) {
          throw new RAError(`${sym} exige relações compatíveis (mesmo número de atributos): esquerda tem ${L.cols.length} (${L.cols.map(disp).join(', ')}), direita tem ${R.cols.length} (${R.cols.map(disp).join(', ')}).`);
        }
        const kw = { UNION: 'UNION', INTERSECT: 'INTERSECT', MINUS: 'EXCEPT' }[node.op];
        return { sql: `SELECT * FROM ((${L.sql}) ${kw} (${R.sql})) t`, cols: L.cols };
      }
      case 'DIVIDE': {
        const L = tr(node.l), R = tr(node.r);
        const map = R.cols.map((rc) => {
          const i = L.cols.findIndex((lc) => norm(lc.name) === norm(rc.name));
          if (i < 0) throw new RAError(`÷: o atributo "${rc.name}" do divisor não existe no dividendo. O divisor deve ter apenas atributos do dividendo.`);
          return i;
        });
        const keep = L.cols.map((c, i) => i).filter((i) => !map.includes(i));
        if (!keep.length) throw new RAError('÷: o dividendo precisa ter atributos além dos do divisor.');
        const eqKeep = keep.map((i) => `l2.c${i + 1} = l1.c${i + 1}`).join(' AND ');
        const eqDiv = map.map((i, j) => `l2.c${i + 1} = r.c${j + 1}`).join(' AND ');
        return {
          sql: `SELECT DISTINCT ${keep.map((i, k) => `l1.c${i + 1} AS c${k + 1}`).join(', ')} FROM (${L.sql}) l1 WHERE NOT EXISTS (SELECT 1 FROM (${R.sql}) r WHERE NOT EXISTS (SELECT 1 FROM (${L.sql}) l2 WHERE ${eqKeep} AND ${eqDiv}))`,
          cols: keep.map((i) => L.cols[i]),
        };
      }
      case 'GROUP': {
        const s = tr(node.e);
        const gi = node.groups.map((g) => resolve(s.cols, g));
        const parts = gi.map((i, k) => `t.c${i + 1} AS c${k + 1}`);
        node.aggs.forEach((a, k) => {
          const arg = a.arg === '*' ? '*' : `t.c${resolve(s.cols, a.arg) + 1}`;
          parts.push(`${a.fn}(${a.distinct ? 'DISTINCT ' : ''}${arg}) AS c${gi.length + k + 1}`);
        });
        return {
          sql: `SELECT ${parts.join(', ')} FROM (${s.sql}) t${gi.length ? ' GROUP BY ' + gi.map((i) => `t.c${i + 1}`).join(', ') : ''}`,
          cols: [...gi.map((i) => s.cols[i]), ...node.aggs.map((a) => ({ rel: null, name: a.alias }))],
        };
      }
      default:
        throw new RAError('Operação desconhecida: ' + node.op);
    }
  }

  for (const st of stmts) {
    let r = tr(st.expr);
    if (st.assign) {
      if (st.attrs) {
        if (st.attrs.length !== r.cols.length) throw new RAError(`${st.assign}(...) tem ${st.attrs.length} nomes, mas a expressão tem ${r.cols.length} atributos.`);
        r = { ...r, cols: r.cols.map((c, i) => ({ rel: st.assign, name: st.attrs[i] })) };
      } else r = { ...r, cols: r.cols.map((c) => ({ ...c, rel: st.assign })) };
      env[norm(st.assign)] = { ...r, label: st.assign };
    }
    last = r;
  }
  // nomes finais
  const counts = {};
  last.cols.forEach((c) => { counts[norm(c.name)] = (counts[norm(c.name)] || 0) + 1; });
  const names = last.cols.map((c) => (counts[norm(c.name)] > 1 && c.rel ? `${c.rel}.${c.name}` : c.name));
  const finalSQL = `SELECT ${names.map((nm, i) => `t.c${i + 1} AS "${nm.replace(/"/g, '')}"`).join(', ')} FROM (${last.sql}) t`;
  return { sql: finalSQL, cols: names };
}

/** Carrega o catálogo (tabela → colunas) de um schema. */
export async function loadCatalog(queryFn, schema) {
  const r = await queryFn(`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = '${schema}' ORDER BY table_name, ordinal_position`);
  const cat = {};
  for (const [t, c] of r.rows) (cat[t] = cat[t] || []).push(c);
  return cat;
}

// ---------------- notação "de papel" (com subscritos) ----------------
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CMP = { '=': '=', '<>': '≠', '<': '<', '>': '>', '<=': '≤', '>=': '≥' };
const refTxt = (r) => (r.rel ? r.rel + '.' : '') + r.name;
function arithTxt(a) {
  if (a.num !== undefined) return a.num;
  if (a.str !== undefined) return `'${a.str}'`;
  if (a.nul) return 'NULL';
  if (a.ref) return refTxt(a.ref);
  if (a.arith) return `${arithTxt(a.l)} ${a.arith === '*' ? '×' : a.arith} ${arithTxt(a.r)}`;
  return '?';
}
function condTxt(c, parent) {
  if (c.bool === 'AND' || c.bool === 'OR') {
    const t = `${condTxt(c.l, c.bool)} ${c.bool === 'AND' ? '∧' : '∨'} ${condTxt(c.r, c.bool)}`;
    return parent && parent !== c.bool ? `(${t})` : t;
  }
  if (c.bool === 'NOT') return `¬${c.e.cmp ? '(' + condTxt(c.e) + ')' : condTxt(c.e, 'NOT')}`;
  if (c.cmp) {
    if (c.r.nul) return `${arithTxt(c.l)} ${c.cmp === '=' ? 'é' : 'não é'} nulo`;
    return `${arithTxt(c.l)} ${CMP[c.cmp]} ${arithTxt(c.r)}`;
  }
  return '?';
}
const aggTxt = (a) => `${a.fn}(${a.distinct ? 'DISTINCT ' : ''}${a.arg === '*' ? '*' : refTxt(a.arg)})` + (a.alias && !/^(count|sum|avg|min|max)(_|$)/.test(a.alias) ? ` → ${a.alias}` : '');
const BIN = { JOIN: '⋈', CROSS: '×', LJOIN: '⟕', RJOIN: '⟖', FJOIN: '⟗', UNION: '∪', INTERSECT: '∩', MINUS: '−', DIVIDE: '÷' };
const sub = (t) => `<sub>${esc(t)}</sub>`;
function nodeHTML(n) {
  const arg = (e) => `(${nodeHTML(e)})`;
  switch (n.op) {
    case 'REL': return `<span class="ra-rel">${esc(n.name)}</span>`;
    case 'SELECT': return `<span class="ra-op">σ</span>${sub(condTxt(n.cond))}${arg(n.e)}`;
    case 'PROJECT': return `<span class="ra-op">π</span>${sub(n.items.map((it) => arithTxt(it.e) + (it.alias ? ' → ' + it.alias : '')).join(', '))}${arg(n.e)}`;
    case 'SORT': return `<span class="ra-op">τ</span>${sub(n.items.map((it) => refTxt(it.a) + (it.dir === 'DESC' ? ' desc' : '')).join(', '))}${arg(n.e)}`;
    case 'RENAME_REL': return `<span class="ra-op">ρ</span>${sub(n.name + (n.attrs ? '(' + n.attrs.join(', ') + ')' : ''))}${arg(n.e)}`;
    case 'RENAME_ATTR': return `<span class="ra-op">ρ</span>${sub(n.pairs.map((p) => p.to + ' ← ' + refTxt(p.from)).join(', '))}${arg(n.e)}`;
    case 'GROUP': return `${n.groups.length ? sub(n.groups.map(refTxt).join(', ')) : ''}<span class="ra-op">ℑ</span>${sub(n.aggs.map(aggTxt).join(', '))}${arg(n.e)}`;
    default: {
      if (!BIN[n.op]) return '?';
      const side = (e) => (BIN[e.op] ? `(${nodeHTML(e)})` : nodeHTML(e));
      return `${side(n.l)} <span class="ra-op">${BIN[n.op]}</span>${n.cond ? sub(condTxt(n.cond)) : ''} ${side(n.r)}`;
    }
  }
}

/** Mostra a expressão como se escreve no papel (subscritos). Lança RAError se não for válida. */
export function renderRA(src) {
  const stmts = new Parser(tokenize(src)).program();
  return stmts.map((st) => `<div class="ra-line">${st.assign ? `<span class="ra-rel">${esc(st.assign)}${st.attrs ? '(' + esc(st.attrs.join(', ')) + ')' : ''}</span> <span class="ra-op">←</span> ` : ''}${nodeHTML(st.expr)}</div>`).join('');
}

// [símbolo, ajuda, modelo inserido, quantos caracteres voltar o cursor]
export const RA_OPS = [
  ['σ', 'seleção — σ[condição](R)', 'σ[]()', 3],
  ['π', 'projeção — π[a, b](R)', 'π[]()', 3],
  ['ρ', 'renomear — ρ[X](R) · ρ[X(a, b)](R) · ρ[novo ← velho](R)', 'ρ[]()', 3],
  ['⋈', 'junção — R ⋈[condição] S · natural: R ⋈ S', ' ⋈[] ', 2],
  ['×', 'produto cartesiano — R × S', ' × ', 0],
  ['∪', 'união — R ∪ S', ' ∪ ', 0],
  ['∩', 'interseção — R ∩ S', ' ∩ ', 0],
  ['−', 'diferença — R − S', ' − ', 0],
  ['÷', 'divisão — R ÷ S', ' ÷ ', 0],
  ['ℑ', 'agregação (notação de aula) — dnum ℑ[COUNT(*) → qtd](R)', ' ℑ[]()', 3],
  ['γ', 'agregação — γ[dnum; COUNT(*) → qtd](R)', 'γ[]()', 3],
  ['⟕', 'junção externa à esquerda — R ⟕[condição] S', ' ⟕[] ', 2],
  ['⟖', 'junção externa à direita — R ⟖[condição] S', ' ⟖[] ', 2],
  ['⟗', 'junção externa completa — R ⟗[condição] S', ' ⟗[] ', 2],
  ['←', 'atribuição — T ← expressão (uma por linha)', ' ← ', 0],
];
export const RA_LOGIC = [
  ['∧', 'e'], ['∨', 'ou'], ['¬', 'não'], ['≠', 'diferente'], ['≤', 'menor ou igual'], ['≥', 'maior ou igual'], ['→', 'dar nome: COUNT(*) → qtd'],
];

